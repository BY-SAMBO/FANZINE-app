import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  createFudoSale,
  addFudoItem,
  addFudoSubitem,
  addFudoPayment,
  closeFudoSale,
  getAllFudoPaymentMethods,
} from "@/lib/fudo/pos-client";
import { handleApiError, AppError } from "@/lib/utils/errors";
import type { OrderItem, SaleType, PaymentMethod } from "@/types/pos";

interface SaleRequest {
  items: OrderItem[];
  sale_type: SaleType;
  payment_method: PaymentMethod;
  total: number;
}

// Map our payment method names to Fudo payment method IDs (cached per cold start)
let paymentMethodCache: Map<string, string> | null = null;

// Map our internal method names to Fudo code values (excludes Rappi methods)
const FUDO_CODE_MAP: Record<string, string[]> = {
  cash: ["cash"],         // Efectivo (id:1), skip Efectivo Rappi by name
  card: ["credit-card"],  // Tarjeta (id:3)
  nequi: ["nequi"],       // Nequi (id:5)
  daviplata: ["daviplata"], // Daviplata (id:6)
  llaves: ["llaves"],     // Llaves (id:7)
};

async function getPaymentMethodId(method: PaymentMethod): Promise<string> {
  if (!paymentMethodCache) {
    const methods = await getAllFudoPaymentMethods();
    paymentMethodCache = new Map();

    // Build cache: map each of our methods to the correct Fudo ID
    for (const [ourMethod, codes] of Object.entries(FUDO_CODE_MAP)) {
      for (const m of methods) {
        const name = m.attributes.name.toLowerCase();
        // Skip Rappi methods — they're for delivery platforms, not POS
        if (name.includes("rappi")) continue;
        if (codes.includes(m.attributes.code)) {
          paymentMethodCache.set(ourMethod, m.id);
          break; // first match wins
        }
      }
    }
  }

  const id = paymentMethodCache.get(method);
  if (!id) {
    throw new AppError(
      `Metodo de pago "${method}" no encontrado en Fudo`,
      "PAYMENT_METHOD_NOT_FOUND",
      400
    );
  }
  return id;
}

export async function POST(request: Request) {
  let step = "init";
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Check role
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("rol, nombre")
      .eq("id", user.id)
      .single();

    if (!profile || !["administrador", "cajero"].includes(profile.rol)) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }

    const body: SaleRequest = await request.json();

    if (!body.items?.length) {
      return NextResponse.json(
        { error: "La orden no tiene items" },
        { status: 400 }
      );
    }

    // 1. Create sale in Fudo
    step = "create_sale";
    console.log("[POS Sale] Step 1: Creating sale", { sale_type: body.sale_type });
    const sale = await createFudoSale(body.sale_type);
    console.log("[POS Sale] Sale created:", sale.id);

    // 2. Add items + subitems (parallel) and resolve payment method concurrently
    step = "add_items_and_resolve_payment";
    const warnings: string[] = [];

    console.log("[POS Sale] Step 2: Adding items in parallel + resolving payment method", {
      item_count: body.items.length,
      sale_id: sale.id,
    });

    const [paymentMethodId] = await Promise.all([
      getPaymentMethodId(body.payment_method),
      // Process all items in parallel
      Promise.all(body.items.map(async (item) => {
        console.log("[POS Sale] Step 2: Adding item", {
          fudo_product_id: item.fudo_product_id,
          quantity: item.quantity,
          sale_id: sale.id,
        });
        const fudoItem = await addFudoItem(
          sale.id,
          item.fudo_product_id,
          item.quantity
        );

        // Add subitems for this item in parallel
        const validMods = item.modifiers.filter(
          (mod) => mod.topping_product_fudo_id && mod.modifier_group_fudo_id
        );
        const skippedMods = item.modifiers.filter(
          (mod) => !mod.topping_product_fudo_id || !mod.modifier_group_fudo_id
        );
        for (const mod of skippedMods) {
          console.warn("[POS Sale] Skipping subitem with missing IDs:", mod.name);
        }

        if (validMods.length > 0) {
          const subitemResults = await Promise.allSettled(
            validMods.map((mod) => {
              console.log("[POS Sale] Step 2b: Adding subitem", {
                item_id: fudoItem.id,
                topping_product_id: mod.topping_product_fudo_id,
                group_id: mod.modifier_group_fudo_id,
                quantity: mod.quantity,
              });
              return addFudoSubitem(
                fudoItem.id,
                mod.topping_product_fudo_id,
                mod.modifier_group_fudo_id,
                mod.quantity
              );
            })
          );

          subitemResults.forEach((result, i) => {
            if (result.status === "rejected") {
              warnings.push(`Subitem "${validMods[i].name}" falló`);
              console.error("[POS Sale] Subitem failed:", validMods[i].name, result.reason);
            }
          });
        }
      })),
    ]);

    // 3. Add payment
    step = "add_payment";
    console.log("[POS Sale] Step 3: Adding payment", {
      sale_id: sale.id,
      payment_method_id: paymentMethodId,
      amount: body.total,
    });
    await addFudoPayment(sale.id, paymentMethodId, body.total);

    // 4. Close sale
    step = "close_sale";
    console.log("[POS Sale] Step 4: Closing sale", sale.id);
    await closeFudoSale(sale.id);

    // 5. Log locally (fire-and-forget — don't block response)
    console.log("[POS Sale] Step 5: Logging sale", sale.id);
    supabase
      .from("pos_sales_log")
      .insert({
        fudo_sale_id: sale.id,
        sale_type: body.sale_type,
        items: body.items,
        total: body.total,
        payment_method: body.payment_method,
        cashier_id: user.id,
        cashier_name: profile.nombre,
        closed_at: new Date().toISOString(),
      })
      .then(({ error: logError }) => {
        if (logError) console.error("Error logging sale:", logError);
      });

    console.log("[POS Sale] Complete!", { fudo_sale_id: sale.id });

    return NextResponse.json({
      success: true,
      fudo_sale_id: sale.id,
      warnings: warnings.length > 0 ? warnings : undefined,
    });
  } catch (error) {
    console.error(`[POS Sale] Failed at step: ${step}`, error);
    if (error instanceof Error && "fudoResponse" in error) {
      console.error("[POS Sale] Fudo response body:", (error as { fudoResponse: unknown }).fudoResponse);
    }
    return handleApiError(error);
  }
}
