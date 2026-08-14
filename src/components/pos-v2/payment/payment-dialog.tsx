"use client";

import { useState } from "react";
import { toast } from "sonner";
import { usePosV2Store } from "@/lib/pos-v2/store";
import { useSubmitOrder, type SubmitOrderPayload } from "@/lib/hooks/use-pos-v2";
import { usePrinterStore } from "@/lib/stores/printer-store";
import { useOfflineQueue } from "@/lib/pos-v2/offline-queue";
import { generateComanda } from "@/lib/print/comanda-esc";
import type { SalePayment, SaleMode } from "@/types/pos-v2";
import { cn } from "@/lib/utils";
import {
  SplitPayment,
  paymentsAreValid,
} from "./split-payment";

interface PaymentDialogProps {
  open: boolean;
  onClose: () => void;
  onSaleSuccess?: (fudoSaleId: string) => void;
}

export function PaymentDialog({ open, onClose, onSaleSuccess }: PaymentDialogProps) {
  const [payments, setPayments] = useState<SalePayment[]>([
    { method: "cash", amount: 0 },
  ]);
  const order = usePosV2Store((s) => s.order);
  const clearOrder = usePosV2Store((s) => s.clearOrder);
  const setStatus = usePosV2Store((s) => s.setStatus);
  const submitOrder = useSubmitOrder();
  const printer = usePrinterStore();
  const enqueue = useOfflineQueue((s) => s.enqueue);

  const total = order.total ?? 0;

  if (!open) return null;

  // In single mode the one method always covers the live total
  const resolvedPayments: SalePayment[] =
    payments.length === 1
      ? [{ method: payments[0].method, amount: total }]
      : payments;

  const splitValid = paymentsAreValid(resolvedPayments, total);

  const handleSubmit = async (saleMode: SaleMode) => {
    const freshOrder = usePosV2Store.getState().order;

    // Snapshot for comanda printing
    const orderSnapshot = {
      items: freshOrder.items.map((i) => ({
        name: i.name,
        quantity: i.quantity,
        price: i.price,
        modifiers: i.modifiers.map((m) => ({
          name: m.name,
          quantity: m.quantity,
          price: m.price,
          group_name: m.group_name,
        })),
      })),
      sale_type: freshOrder.sale_type,
      total: freshOrder.total,
    };

    const payload: SubmitOrderPayload = {
      items: freshOrder.items,
      sale_type: freshOrder.sale_type,
      sale_mode: saleMode,
      payment_method: saleMode === "comanda" ? "cash" : resolvedPayments[0].method,
      payments: saleMode === "comanda" ? undefined : resolvedPayments,
      total: freshOrder.total,
    };

    const printComanda = (saleId: string, cashierName: string) => {
      if (saleMode !== "comanda" || !printer.connected) return;
      const ticket = generateComanda({
        sale_id: saleId,
        sale_type: orderSnapshot.sale_type,
        items: orderSnapshot.items,
        total: orderSnapshot.total,
        cashier_name: cashierName,
      });
      printer.printRaw(ticket).catch((err) =>
        console.error("[WebUSB Print] Failed:", err)
      );
    };

    // Sin internet: guardar en cola local y seguir vendiendo
    const queueOffline = () => {
      enqueue({
        kind: "sale",
        payload: payload as unknown as Record<string, unknown>,
        label: `${saleMode === "comanda" ? "Comanda" : "Venta"} $${freshOrder.total.toLocaleString()}`,
        total: freshOrder.total,
      });
      clearOrder();
      setPayments([{ method: "cash", amount: 0 }]);
      onClose();
      toast.warning("Sin internet — venta guardada. Se sincroniza al volver la conexión.", {
        duration: 5000,
      });
      // The thermal printer is USB — it still works offline
      printComanda("OFFLINE", "");
    };

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      queueOffline();
      return;
    }

    try {
      setStatus("paying");
      const result = await submitOrder.mutateAsync(payload);

      clearOrder();
      setPayments([{ method: "cash", amount: 0 }]);
      onClose();
      if (result?.fudo_sale_id) {
        onSaleSuccess?.(result.fudo_sale_id);
        printComanda(result.fudo_sale_id, result.cashier_name || "");
      }
    } catch (err) {
      // Network failure mid-request — queue it instead of losing the sale
      if (err instanceof TypeError || !navigator.onLine) {
        queueOffline();
        return;
      }
      setStatus("error");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="w-full max-w-sm border border-gray-200 bg-white rounded-xl shadow-2xl p-6 space-y-6">
        <h2 className="text-xl font-bold text-gray-900 uppercase tracking-wider text-center">
          Cobrar
        </h2>

        {/* Total */}
        <div className="text-center">
          <p className="text-gray-400 text-sm">Total</p>
          <p className="text-4xl font-extrabold text-gray-900 tabular-nums">
            ${total.toLocaleString()}
          </p>
        </div>

        {/* Payment method(s) */}
        <div className="space-y-2">
          <SplitPayment total={total} payments={resolvedPayments} onChange={setPayments} />
          <p className="text-gray-300 text-[10px] text-center">
            Solo para &quot;Sin Comanda&quot; &mdash; las comandas se cobran al cerrar
          </p>
        </div>

        {/* Printer status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "w-2 h-2 rounded-full",
                printer.connected ? "bg-green-500" : "bg-gray-300"
              )}
            />
            <span className="text-xs text-gray-400">
              {!printer.isSupported
                ? "WebUSB no soportado"
                : printer.connected
                  ? "Impresora conectada"
                  : "Sin impresora"}
            </span>
          </div>
          {printer.isSupported && !printer.connected && (
            <button
              onClick={printer.connect}
              className="text-xs font-semibold text-red-600 hover:text-red-700"
            >
              Conectar
            </button>
          )}
        </div>

        {printer.error && (
          <p className="text-orange-600 text-xs text-center">{printer.error}</p>
        )}

        {submitOrder.isError && (
          <p className="text-red-600 text-sm text-center">
            {submitOrder.error?.message || "Error al procesar pago"}
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={submitOrder.isPending}
            className="flex-1 py-3 border-2 border-gray-200 text-gray-500 text-sm font-bold uppercase tracking-wider hover:border-gray-400 hover:text-gray-900 disabled:opacity-30 transition-all rounded-lg"
          >
            Cancelar
          </button>
          <button
            onClick={() => handleSubmit("comanda")}
            disabled={submitOrder.isPending}
            className="flex-1 py-3 border-2 border-yellow-400 bg-yellow-50 text-yellow-800 text-sm font-bold uppercase tracking-wider hover:bg-yellow-100 hover:border-yellow-500 disabled:opacity-50 transition-all rounded-lg"
          >
            {submitOrder.isPending ? "..." : "Comanda"}
          </button>
          <button
            onClick={() => handleSubmit("instant")}
            disabled={submitOrder.isPending || !splitValid}
            title={!splitValid ? "Los pagos deben sumar el total" : undefined}
            className="flex-1 py-3 bg-red-600 border-2 border-red-600 text-white text-sm font-bold uppercase tracking-wider hover:bg-red-700 hover:border-red-700 disabled:opacity-50 transition-all rounded-lg"
          >
            {submitOrder.isPending ? "..." : "Cobrar"}
          </button>
        </div>
      </div>
    </div>
  );
}
