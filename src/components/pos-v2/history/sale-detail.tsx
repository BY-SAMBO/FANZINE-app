"use client";

import { useState } from "react";
import { X, Printer } from "lucide-react";
import { useCloseSale } from "@/lib/hooks/use-pos-v2";
import { usePrinterStore } from "@/lib/stores/printer-store";
import { generateComanda } from "@/lib/print/comanda-esc";
import type { PaymentMethod, SaleLogEntry, SaleLogItem } from "@/types/pos-v2";
import { cn } from "@/lib/utils";

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: "cash", label: "Efectivo" },
  { value: "card", label: "Tarjeta" },
  { value: "nequi", label: "Nequi" },
  { value: "daviplata", label: "Daviplata" },
  { value: "llaves", label: "Llaves" },
];

interface SaleDetailDialogProps {
  order: SaleLogEntry;
  onClose: () => void;
}

export function SaleDetailDialog({ order, onClose }: SaleDetailDialogProps) {
  const [method, setMethod] = useState<PaymentMethod>(
    (order.payment_method as PaymentMethod) || "cash"
  );
  const closeSale = useCloseSale();
  const printer = usePrinterStore();

  const isOpen = order.sale_status === "open";
  const total = Number(order.total);
  const items = (order.items || []) as SaleLogItem[];

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

  const handleClose = () => {
    closeSale.mutate(
      {
        fudo_sale_id: order.fudo_sale_id,
        payment_method: method,
        total,
      },
      { onSuccess: () => onClose() }
    );
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

        {/* Payment method for open orders */}
        {isOpen && (
          <div className="px-5 py-3 space-y-2 border-t border-gray-100">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
              Método de pago
            </p>
            <div className="flex gap-2">
              {PAYMENT_METHODS.map((pm) => (
                <button
                  key={pm.value}
                  onClick={() => setMethod(pm.value)}
                  className={cn(
                    "flex-1 py-2.5 text-xs font-bold uppercase tracking-wider border-2 transition-all rounded-lg",
                    method === pm.value
                      ? "bg-green-600 text-white border-green-600"
                      : "text-gray-500 border-gray-200 hover:border-gray-400"
                  )}
                >
                  {pm.label}
                </button>
              ))}
            </div>
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
                disabled={closeSale.isPending}
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
