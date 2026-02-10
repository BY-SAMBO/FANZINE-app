"use client";

import { useState } from "react";
import { usePosStore } from "@/lib/stores/pos-live-store";
import { useSubmitOrder } from "@/lib/hooks/use-pos";
import { useAuth } from "@/lib/hooks/use-auth";
import type { PaymentMethod, PosEvent } from "@/types/pos";
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
  const { order, clearOrder, setStatus } = usePosStore();
  const submitOrder = useSubmitOrder();

  if (!open) return null;

  const handleSubmit = async () => {
    try {
      setStatus("paying");
      const result = await submitOrder.mutateAsync({
        items: order.items,
        sale_type: order.sale_type,
        payment_method: method,
        total: order.total,
      });

      // Broadcast clear to client screen
      onSend({ type: "clear" });
      clearOrder();
      onClose();
      if (result?.fudo_sale_id) {
        onSaleSuccess?.(result.fudo_sale_id);
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

        {/* Payment method */}
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
        </div>

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
            onClick={handleSubmit}
            disabled={submitOrder.isPending}
            className="flex-[2] py-3 bg-red-600 border-2 border-red-600 text-white text-sm font-bold uppercase tracking-wider hover:bg-red-700 hover:border-red-700 disabled:opacity-50 transition-all rounded-lg"
          >
            {submitOrder.isPending ? "Procesando..." : "Confirmar"}
          </button>
        </div>
      </div>
    </div>
  );
}
