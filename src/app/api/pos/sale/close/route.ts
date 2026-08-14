import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  addFudoPayment,
  closeFudoSale,
  getAllFudoPaymentMethods,
} from "@/lib/fudo/pos-client";
import { fudoFetch } from "@/lib/fudo/client";
import { FUDO_CONFIG } from "@/lib/fudo/config";
import { handleApiError, AppError, FudoApiError } from "@/lib/utils/errors";
import type { PaymentMethod, SalePayment } from "@/types/pos";

interface CloseRequest {
  fudo_sale_id: string;
  payment_method: PaymentMethod;
  payments?: SalePayment[]; // split payments; falls back to payment_method + total
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

    // Normalize to a payments list (split or single) and validate
    const payments: SalePayment[] =
      body.payments && body.payments.length > 0
        ? body.payments
        : [{ method: body.payment_method, amount: body.total }];

    if (payments.some((p) => !p.method || !(p.amount > 0))) {
      return NextResponse.json(
        { error: "Cada pago debe tener metodo y monto mayor a 0" },
        { status: 400 }
      );
    }
    const paymentsSum = payments.reduce((s, p) => s + p.amount, 0);
    if (Math.round(paymentsSum) !== Math.round(body.total)) {
      return NextResponse.json(
        {
          error: `La suma de los pagos ($${paymentsSum}) no coincide con el total ($${body.total})`,
        },
        { status: 400 }
      );
    }

    // 1. Resolve payment methods
    step = "resolve_payment";
    console.log(
      "[POS Close] Resolving payment methods",
      payments.map((p) => p.method)
    );
    const paymentMethodIds = await Promise.all(
      payments.map((p) => getPaymentMethodId(p.method))
    );

    // 2. Add payments to Fudo sale
    step = "add_payment";
    console.log("[POS Close] Adding payments", {
      sale_id: body.fudo_sale_id,
      payments,
    });

    let alreadyClosed = false;
    try {
      await addFudoPayment(body.fudo_sale_id, paymentMethodIds[0], payments[0].amount);
    } catch (err) {
      // If Fudo returns 422, the sale may have been closed/cancelled directly in Fudo
      if (err instanceof FudoApiError && err.fudoStatus === 422) {
        console.warn(
          "[POS Close] Fudo 422 on addPayment — checking sale state in Fudo"
        );
        try {
          const saleRes = await fudoFetch<{
            data: { attributes: { saleState: string } };
          }>(`${FUDO_CONFIG.endpoints.sales}/${body.fudo_sale_id}`);
          const fudoState = saleRes.data.attributes.saleState;
          console.log("[POS Close] Fudo sale state:", fudoState);

          if (fudoState === "CLOSED" || fudoState === "CANCELLED") {
            alreadyClosed = true;
          } else {
            // Sale exists but is in an unexpected state — re-throw original error
            throw err;
          }
        } catch (fetchErr) {
          // If we can't even fetch the sale, re-throw the original 422
          if (fetchErr === err) throw err;
          if (fetchErr instanceof FudoApiError && fetchErr.fudoStatus === 404) {
            // Sale doesn't exist in Fudo — treat as already gone
            alreadyClosed = true;
          } else {
            throw err;
          }
        }
      } else {
        throw err;
      }
    }

    if (!alreadyClosed) {
      // Remaining split payments (first one already added above)
      for (let i = 1; i < payments.length; i++) {
        await addFudoPayment(
          body.fudo_sale_id,
          paymentMethodIds[i],
          payments[i].amount
        );
      }

      // 3. Close sale in Fudo
      step = "close_sale";
      console.log("[POS Close] Closing sale", body.fudo_sale_id);
      await closeFudoSale(body.fudo_sale_id);
    }

    // 4. Update local log
    step = "update_log";
    const localStatus = alreadyClosed ? "cancelled" : "closed";
    const { error: updateError } = await supabase
      .from("pos_sales_log")
      .update({
        sale_status: localStatus,
        payment_method: alreadyClosed
          ? "none"
          : [...new Set(payments.map((p) => p.method))].join("+"),
        closed_at: new Date().toISOString(),
      })
      .eq("fudo_sale_id", body.fudo_sale_id);

    if (updateError) {
      console.error("[POS Close] Error updating log:", updateError);
    }

    console.log(
      "[POS Close] Complete!",
      body.fudo_sale_id,
      alreadyClosed ? "(was already closed/cancelled in Fudo)" : ""
    );

    return NextResponse.json({
      success: true,
      already_closed: alreadyClosed,
    });
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
