import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  addFudoPayment,
  closeFudoSale,
  getAllFudoPaymentMethods,
} from "@/lib/fudo/pos-client";
import { handleApiError, AppError } from "@/lib/utils/errors";
import type { PaymentMethod } from "@/types/pos";

interface CloseRequest {
  fudo_sale_id: string;
  payment_method: PaymentMethod;
  total: number;
}

// Cached payment method map (same logic as sale route)
let paymentMethodCache: Map<string, string> | null = null;

const FUDO_CODE_MAP: Record<string, string[]> = {
  cash: ["cash"],
  card: ["credit-card"],
  nequi: ["nequi"],
  daviplata: ["daviplata"],
  llaves: ["llaves"],
};

async function getPaymentMethodId(method: PaymentMethod): Promise<string> {
  if (!paymentMethodCache) {
    const methods = await getAllFudoPaymentMethods();
    paymentMethodCache = new Map();
    for (const [ourMethod, codes] of Object.entries(FUDO_CODE_MAP)) {
      for (const m of methods) {
        const name = m.attributes.name.toLowerCase();
        if (name.includes("rappi")) continue;
        if (codes.includes(m.attributes.code)) {
          paymentMethodCache.set(ourMethod, m.id);
          break;
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

    const { data: profile } = await supabase
      .from("user_profiles")
      .select("rol")
      .eq("id", user.id)
      .single();

    if (!profile || !["administrador", "cajero"].includes(profile.rol)) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }

    const body: CloseRequest = await request.json();

    if (!body.fudo_sale_id) {
      return NextResponse.json(
        { error: "fudo_sale_id requerido" },
        { status: 400 }
      );
    }

    // 1. Resolve payment method
    step = "resolve_payment";
    console.log("[POS Close] Resolving payment method", body.payment_method);
    const paymentMethodId = await getPaymentMethodId(body.payment_method);

    // 2. Add payment to Fudo sale
    step = "add_payment";
    console.log("[POS Close] Adding payment", {
      sale_id: body.fudo_sale_id,
      payment_method_id: paymentMethodId,
      amount: body.total,
    });
    await addFudoPayment(body.fudo_sale_id, paymentMethodId, body.total);

    // 3. Close sale in Fudo
    step = "close_sale";
    console.log("[POS Close] Closing sale", body.fudo_sale_id);
    await closeFudoSale(body.fudo_sale_id);

    // 4. Update local log
    step = "update_log";
    const { error: updateError } = await supabase
      .from("pos_sales_log")
      .update({
        sale_status: "closed",
        payment_method: body.payment_method,
        closed_at: new Date().toISOString(),
      })
      .eq("fudo_sale_id", body.fudo_sale_id);

    if (updateError) {
      console.error("[POS Close] Error updating log:", updateError);
    }

    console.log("[POS Close] Complete!", body.fudo_sale_id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`[POS Close] Failed at step: ${step}`, error);
    if (error instanceof Error && "fudoResponse" in error) {
      console.error(
        "[POS Close] Fudo response body:",
        (error as { fudoResponse: unknown }).fudoResponse
      );
    }
    return handleApiError(error);
  }
}
