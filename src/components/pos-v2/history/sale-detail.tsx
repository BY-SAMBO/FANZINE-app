"use client";

import { useState } from "react";
import { X, Printer } from "lucide-react";
import { toast } from "sonner";
import { useCloseSale } from "@/lib/hooks/use-pos-v2";
import { usePrinterStore } from "@/lib/stores/printer-store";
import { useOfflineQueue } from "@/lib/pos-v2/offline-queue";
import { generateComanda } from "@/lib/print/comanda-esc";
import type { PaymentMethod, SalePayment, SaleLogEntry, SaleLogItem } from "@/types/pos-v2";
import { cn } from "@/lib/utils";
import {
  SplitPayment,
  paymentsAreValid,
} from "../payment/split-payment";

interface SaleDetailDialogProps {
  order: SaleLogEntry;
  onClose: () => void;
}

export function SaleDetailDialog({ order, onClose }: SaleDetailDialogProps) {
  const isOpen = order.sale_status === "open";
  const total = Number(order.total);
  const items = (order.items || []) as SaleLogItem[];

  const initialMethod = (
    ["cash", "card", "nequi", "daviplata", "llaves"].includes(order.payment_method)
      ? order.payment_method
      : "cash"
  ) as PaymentMethod;
  const [payments, setPayments] = useState<SalePayment[]>([
    { method: initialMethod, amount: total },
  ]);
  const closeSale = useCloseSale();
  const printer = usePrinterStore();
  const enqueue = useOfflineQueue((s) => s.enqueue);

  const splitValid = paymentsAreValid(payments, total);

  const createdAt = new Date(order.created_at);
  const time = createdAt.toLocaleTimeString("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Bogota",
  });
  const date = createdAt.toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "America/Bogota",
  });

  const handleClose = async () => {
    const payload = {
      fudo_sale_id: order.fudo_sale_id,
      payment_method: payments[0].method,
      payments,
      total,
    };

    // Sin internet: encolar el cierre y sincronizarlo al volver la conexión
    const queueOffline = () => {
      enqueue({
        kind: "close",
        payload: payload as unknown as Record<string, unknown>,
        label: `Cierre cuenta #${order.fudo_sale_id} $${total.toLocaleString()}`,
        total,
      });
      onClose();
      toast.warning(
        "Sin internet — el cierre quedó guardado y se sincroniza al volver la conexión.",
        { duration: 5000 }
      );
    };

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      queueOffline();
      return;
    }

    try {
      await closeSale.mutateAsync(payload);
      onClose();
    } catch (err) {
      if (err instanceof TypeError || !navigator.onLine) {
        queueOffline();
      }
      // Other errors stay visible via closeSale.isError below
    }
  };

  const handlePrint = () => {
    if (!printer.connected) return;
    const ticket = generateComanda({
      sale_id: order.fudo_sale_id,
      sale_type: "TAKEAWAY",
      items: items.map((i) => ({
        name: i.name,
        quantity: i.quantity,
        price: i.price,
        modifiers: (i.modifiers || []).map((m) => ({
          name: m.name,
          quantity: m.quantity,
          price: m.price,
          group_name: m.group_name,
        })),
      })),
      total,
      cashier_name: order.cashier_name || "",
    });
    printer.printRaw(ticket).catch((err) =>
      console.error("[Print] Failed:", err)
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <span className="text-sm font-extrabold text-gray-900 tabular-nums">
              #{order.fudo_sale_id}
            </span>
            {isOpen ? (
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-yellow-100 text-yellow-700 rounded-full animate-pulse">
                Abierta
              </span>
            ) : order.sale_status === "cancelled" ? (
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-red-100 text-red-600 rounded-full">
                Cancelada
              </span>
            ) : (
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-green-100 text-green-700 rounded-full">
                Cerrada
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 tabular-nums">
              {date} {time}
            </span>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Items */}
        <div className="px-5 py-4 max-h-[40vh] overflow-y-auto space-y-2">
          {items.map((item, idx) => {
            const itemTotal = item.price * item.quantity;
            const modTotal = (item.modifiers || []).reduce(
              (s, m) => s + m.price * m.quantity,
              0
            );
            return (
              <div key={idx}>
                <div className="flex justify-between items-baseline">
                  <span className="text-sm font-bold text-gray-900">
                    {item.quantity}x {item.name}
                  </span>
                  <span className="text-sm font-extrabold text-gray-900 tabular-nums ml-2 shrink-0">
                    ${itemTotal.toLocaleString()}
                  </span>
                </div>
                {(item.modifiers || []).map((mod, midx) => (
                  <div
                    key={midx}
                    className="flex justify-between items-baseline pl-4 mt-0.5"
                  >
                    <span className="text-xs text-gray-500">+ {mod.name}</span>
                    {mod.price > 0 && (
                      <span className="text-xs font-semibold text-gray-500 tabular-nums ml-2 shrink-0">
                        +${(mod.price * mod.quantity).toLocaleString()}
                      </span>
                    )}
                  </div>
                ))}
                {modTotal > 0 && (
                  <div className="flex justify-end pl-4 mt-0.5">
                    <span className="text-xs font-bold text-gray-700 tabular-nums">
                      Subtotal: ${(itemTotal + modTotal * item.quantity).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Total */}
        <div className="flex justify-between items-center px-5 py-3 border-t border-gray-100 bg-gray-50">
          <span className="text-sm font-extrabold uppercase tracking-wider text-gray-500">
            Total
          </span>
          <span className="text-2xl font-extrabold text-gray-900 tabular-nums">
            ${total.toLocaleString()}
          </span>
        </div>

        {/* Payment method(s) for open orders */}
        {isOpen && (
          <div className="px-5 py-3 border-t border-gray-100">
            <SplitPayment
              total={total}
              payments={payments}
              onChange={setPayments}
              accent="green"
            />
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 px-5 py-4 border-t border-gray-100">
          <button
            onClick={handlePrint}
            disabled={!printer.connected}
            title={printer.connected ? "Reimprimir comanda" : "Conectar impresora primero"}
            className={cn(
              "w-11 h-11 flex items-center justify-center border-2 rounded-lg transition-all shrink-0",
              printer.connected
                ? "border-gray-200 text-gray-600 hover:border-gray-400 hover:text-gray-900"
                : "border-gray-100 text-gray-300 cursor-not-allowed"
            )}
          >
            <Printer className="w-4 h-4" />
          </button>

          {isOpen ? (
            <>
              <button
                onClick={onClose}
                disabled={closeSale.isPending}
                className="flex-1 py-3 border-2 border-gray-200 text-gray-500 text-sm font-bold uppercase tracking-wider hover:border-gray-400 hover:text-gray-900 disabled:opacity-30 transition-all rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={handleClose}
                disabled={closeSale.isPending || !splitValid}
                title={!splitValid ? "Los pagos deben sumar el total" : undefined}
                className="flex-[2] py-3 bg-green-600 border-2 border-green-600 text-white text-sm font-bold uppercase tracking-wider hover:bg-green-700 hover:border-green-700 disabled:opacity-50 transition-all rounded-lg"
              >
                {closeSale.isPending ? "Cerrando..." : "Cerrar y Cobrar"}
              </button>
            </>
          ) : (
            <button
              onClick={onClose}
              className="flex-1 py-3 border-2 border-gray-200 text-gray-500 text-sm font-bold uppercase tracking-wider hover:border-gray-400 hover:text-gray-900 transition-all rounded-lg"
            >
              Cerrar
            </button>
          )}
        </div>

        {closeSale.isError && (
          <div className="px-5 pb-4">
            <p className="text-red-600 text-xs text-center">
              {closeSale.error?.message || "Error al cerrar venta"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
