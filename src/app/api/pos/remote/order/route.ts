import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { createIntegrationsOrder } from "@/lib/fudo/integrations-client";
import { handleApiError, AppError } from "@/lib/utils/errors";
import type { OrderItem } from "@/types/pos";
import type {
  IntegrationsOrderPayload,
  IntegrationsOrderItem,
  IntegrationsSubitem,
} from "@/lib/fudo/integrations-types";

interface RemoteOrderRequest {
  location_id: string;
  items: OrderItem[];
  customer_name: string;
  customer_phone: string;
  comment?: string;
  total: number;
}

export async function POST(request: Request) {
  let step = "init";
  try {
    // Auth check
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Role check
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("rol, nombre")
      .eq("id", user.id)
      .single();

    if (!profile || !["administrador", "cajero"].includes(profile.rol)) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }

    const body: RemoteOrderRequest = await request.json();

    // Validate
    if (!body.location_id) {
      throw new AppError("Falta location_id", "VALIDATION_ERROR", 400);
    }
    if (!body.items?.length) {
      throw new AppError("La orden no tiene items", "VALIDATION_ERROR", 400);
    }
    if (!body.customer_name?.trim()) {
      throw new AppError("Falta nombre del cliente", "VALIDATION_ERROR", 400);
    }

    // Fetch location with credentials (service role to bypass RLS on secrets)
    step = "fetch_location";
    const serviceClient = await createServiceClient();
    const { data: location, error: locError } = await serviceClient
      .from("remote_pos_locations")
      .select("*")
      .eq("id", body.location_id)
      .eq("is_active", true)
      .single();

    if (locError || !location) {
      throw new AppError("Ubicación no encontrada o inactiva", "LOCATION_NOT_FOUND", 404);
    }

    // Transform items to Integrations API format
    step = "transform_items";
    const items: IntegrationsOrderItem[] = body.items.map((item) => {
      const intItem: IntegrationsOrderItem = {
        quantity: item.quantity,
        price: item.price,
        product: { id: parseInt(item.fudo_product_id, 10) },
      };

      // Transform modifiers to subitems
      if (item.modifiers.length > 0) {
        intItem.subitems = item.modifiers
          .filter((mod) => mod.topping_product_fudo_id && mod.modifier_group_fudo_id)
          .map((mod): IntegrationsSubitem => ({
            productId: parseInt(mod.topping_product_fudo_id, 10),
            productGroupId: parseInt(mod.modifier_group_fudo_id, 10),
            quantity: mod.quantity,
            price: mod.price,
          }));
      }

      return intItem;
    });

    // Build externalId for traceability
    const externalId = `rpos-${location.id.slice(0, 8)}-${Date.now()}`;

    // Build Integrations API payload
    step = "create_order";
    const payload: IntegrationsOrderPayload = {
      order: {
        type: "delivery",
        typeOptions: {
          address: location.address,
        },
        customer: {
          name: body.customer_name.trim(),
          ...(body.customer_phone?.trim() && { phone: body.customer_phone.trim() }),
        },
        items,
        payment: {
          total: body.total + (location.delivery_fee || 0),
        },
        ...(location.delivery_fee > 0 && { shippingCost: Number(location.delivery_fee) }),
        ...(body.comment?.trim() && { comment: body.comment.trim() }),
        externalId,
      },
    };

    console.log("[Remote POS] Creating order", {
      location: location.name,
      externalId,
      items_count: items.length,
      total: body.total,
    });

    const result = await createIntegrationsOrder(
      location.fudo_client_id,
      location.fudo_client_secret,
      payload
    );

    console.log("[Remote POS] Order created in Fudo:", result.order.id);

    // Log locally (fire-and-forget)
    step = "log";
    supabase
      .from("remote_pos_orders_log")
      .insert({
        location_id: location.id,
        location_name: location.name,
        fudo_order_id: result.order.id,
        external_id: externalId,
        items: body.items,
        total: body.total,
        delivery_fee: location.delivery_fee || 0,
        customer_name: body.customer_name.trim(),
        customer_phone: body.customer_phone?.trim() || null,
        comment: body.comment?.trim() || null,
        status: "sent",
        operator_id: user.id,
        operator_name: profile.nombre,
      })
      .then(({ error: logError }) => {
        if (logError) console.error("[Remote POS] Error logging order:", logError);
      });

    return NextResponse.json({
      success: true,
      fudo_order_id: result.order.id,
      external_id: externalId,
    });
  } catch (error) {
    console.error(`[Remote POS] Failed at step: ${step}`, error);
    return handleApiError(error);
  }
}
