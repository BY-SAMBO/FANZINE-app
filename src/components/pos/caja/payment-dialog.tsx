"use client";

import { useState } from "react";
import { usePosStore } from "@/lib/stores/pos-store";
import { useSubmitOrder } from "@/lib/hooks/use-pos";
import { useAuth } from "@/lib/hooks/use-auth";
import type { PaymentMethod, PosEvent } from "@/types/pos";
import { cn } from "@/lib/utils";

interface PaymentDialogProps {
  open: boolean;
  onClose: () => void;
  onSend: (event: PosEvent) => void;
}

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: "cash", label: "Efectivo" },
  { value: "card", label: "Tarjeta" },
  { value: "nequi", label: "Nequi" },
  { value: "daviplata", label: "Daviplata" },
  { value: "llaves", label: "Llaves" },
];

export function PaymentDialog({ open, onClose, onSend }: PaymentDialogProps) {
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const { order, clearOrder, setStatus } = usePosStore();
  const submitOrder = useSubmitOrder();

  if (!open) return null;

  const handleSubmit = async () => {
    try {
      setStatus("paying");
      await submitOrder.mutateAsync({
        items: order.items,
        sale_type: order.sale_type,
        payment_method: method,
        total: order.total,
      });

      // Broadcast clear to client screen
      onSend({ type: "clear" });
      clearOrder();
      onClose();
    } catch {
      setStatus("error");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <div className="w-full max-w-sm border-2 border-white bg-[#1a1117] p-6 space-y-6">
        <h2 className="text-xl font-bold text-white uppercase tracking-wider text-center">
          Cobrar
        </h2>

        {/* Total */}
        <div className="text-center">
          <p className="text-white/50 text-sm">Total</p>
          <p className="text-4xl font-bold text-white">
            ${(order.total ?? 0).toLocaleString()}
          </p>
        </div>

        {/* Payment method */}
        <div className="space-y-2">
          <p className="text-white/50 text-xs uppercase tracking-wider">Metodo de pago</p>
          <div className="flex gap-2">
            {PAYMENT_METHODS.map((pm) => (
              <button
                key={pm.value}
                onClick={() => setMethod(pm.value)}
                className={cn(
                  "flex-1 py-3 text-sm font-bold uppercase tracking-wider border-2 transition-all",
                  method === pm.value
                    ? "bg-[#DC2626] text-white border-white"
                    : "text-white/50 border-white/10 hover:border-white/30"
                )}
              >
                {pm.label}
              </button>
            ))}
          </div>
        </div>

        {/* Error */}
        {submitOrder.isError && (
          <p className="text-red-400 text-sm text-center">
            {submitOrder.error?.message || "Error al procesar pago"}
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={submitOrder.isPending}
            className="flex-1 py-3 border-2 border-white/20 text-white/60 text-sm font-bold uppercase tracking-wider hover:border-white/40 hover:text-white disabled:opacity-30 transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitOrder.isPending}
            className="flex-[2] py-3 bg-[#DC2626] border-2 border-white text-white text-sm font-bold uppercase tracking-wider hover:bg-red-700 disabled:opacity-50 transition-all"
          >
            {submitOrder.isPending ? "Procesando..." : "Confirmar"}
          </button>
        </div>
      </div>
    </div>
  );
}
