"use client";

import { useState } from "react";
import { usePosStore } from "@/lib/stores/pos-store";
import { useSubmitOrder } from "@/lib/hooks/use-pos";
import { useThermalPrinter } from "@/lib/hooks/use-thermal-printer";
import { generateComanda } from "@/lib/print/comanda-esc";
import type { PaymentMethod, SaleMode, PosEvent } from "@/types/pos";
import { cn } from "@/lib/utils";

interface PaymentDialogProps {
  open: boolean;
  onClose: () => void;
  onSend: (event: PosEvent) => void;
  onSaleSuccess?: (fudoSaleId: string) => void;
}

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: "cash", label: "Efectivo" },
  { value: "card", label: "Tarjeta" },
  { value: "nequi", label: "Nequi" },
  { value: "daviplata", label: "Daviplata" },
  { value: "llaves", label: "Llaves" },
];

export function PaymentDialog({ open, onClose, onSend, onSaleSuccess }: PaymentDialogProps) {
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const order = usePosStore((s) => s.order);
  const clearOrder = usePosStore((s) => s.clearOrder);
  const setStatus = usePosStore((s) => s.setStatus);
  const submitOrder = useSubmitOrder();
  const printer = useThermalPrinter();

  if (!open) return null;

  const handleSubmit = async (saleMode: SaleMode) => {
    // Read fresh state directly from store (not the render closure)
    const freshOrder = usePosStore.getState().order;

    // Capture order data before clearing
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

    try {
      setStatus("paying");
      const result = await submitOrder.mutateAsync({
        items: freshOrder.items,
        sale_type: freshOrder.sale_type,
        sale_mode: saleMode,
        // Comanda: no payment yet (will be chosen at close time)
        payment_method: saleMode === "comanda" ? "cash" : method,
        total: freshOrder.total,
      });

      // Broadcast clear to client screen
      onSend({ type: "clear" });
      clearOrder();
      onClose();
      if (result?.fudo_sale_id) {
        onSaleSuccess?.(result.fudo_sale_id);
      }

      // Print comanda via WebUSB (fire-and-forget, after UI is cleared)
      if (saleMode === "comanda" && printer.connected && result?.fudo_sale_id) {
        const comandaData = {
          sale_id: result.fudo_sale_id,
          sale_type: orderSnapshot.sale_type,
          items: orderSnapshot.items,
          total: orderSnapshot.total,
          cashier_name: result.cashier_name || "",
        };
        console.log("[WebUSB Print] Comanda data:", JSON.stringify(comandaData));
        const ticket = generateComanda(comandaData);
        console.log("[WebUSB Print] Ticket bytes:", ticket.length);
        printer.printRaw(ticket).catch((err) =>
          console.error("[WebUSB Print] Failed:", err)
        );
      }
    } catch {
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
            ${(order.total ?? 0).toLocaleString()}
          </p>
        </div>

        {/* Payment method — only for instant (Sin Comanda) */}
        <div className="space-y-2">
          <p className="text-gray-400 text-xs uppercase tracking-wider">Metodo de pago</p>
          <div className="flex gap-2">
            {PAYMENT_METHODS.map((pm) => (
              <button
                key={pm.value}
                onClick={() => setMethod(pm.value)}
                className={cn(
                  "flex-1 py-3 text-sm font-bold uppercase tracking-wider border-2 transition-all rounded-lg",
                  method === pm.value
                    ? "bg-red-600 text-white border-red-600"
                    : "text-gray-500 border-gray-200 hover:border-gray-400"
                )}
              >
                {pm.label}
              </button>
            ))}
          </div>
          <p className="text-gray-300 text-[10px] text-center">
            Solo para &quot;Sin Comanda&quot; — las comandas se cobran al cerrar
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

        {/* Printer error */}
        {printer.error && (
          <p className="text-orange-600 text-xs text-center">{printer.error}</p>
        )}

        {/* Error */}
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
            disabled={submitOrder.isPending}
            className="flex-1 py-3 bg-red-600 border-2 border-red-600 text-white text-sm font-bold uppercase tracking-wider hover:bg-red-700 hover:border-red-700 disabled:opacity-50 transition-all rounded-lg"
          >
            {submitOrder.isPending ? "..." : "Cobrar"}
          </button>
        </div>
      </div>
    </div>
  );
}
