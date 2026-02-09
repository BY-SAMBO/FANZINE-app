"use client";

import { usePosStore } from "@/lib/stores/pos-store";
import { OrderItemRow } from "./order-item-row";

interface OrderPanelProps {
  onPay: () => void;
}

export function OrderPanel({ onPay }: OrderPanelProps) {
  const { order, removeItem, updateItemQuantity, clearOrder } =
    usePosStore();

  return (
    <div className="flex h-full flex-col bg-[#1a1117] border-l-2 border-white/10">
      {/* Header */}
      <div className="flex items-center justify-center border-b border-white/10 py-3">
        <span className="text-xs font-bold uppercase tracking-wider text-[#DC2626]">
          Para llevar
        </span>
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto px-3 py-2">
        {order.items.length === 0 ? (
          <div className="flex h-full items-center justify-center text-white/20 text-sm">
            Agrega productos
          </div>
        ) : (
          order.items.map((item) => (
            <OrderItemRow
              key={item.id}
              item={item}
              onUpdateQuantity={(qty) => updateItemQuantity(item.id, qty)}
              onRemove={() => removeItem(item.id)}
            />
          ))
        )}
      </div>

      {/* Footer */}
      <div className="border-t-2 border-white/10 p-3 space-y-3">
        <div className="flex justify-between text-white">
          <span className="text-lg font-bold">Total</span>
          <span className="text-lg font-bold">
            ${(order.total ?? 0).toLocaleString()}
          </span>
        </div>

        <div className="flex gap-2">
          <button
            onClick={clearOrder}
            disabled={order.items.length === 0}
            className="flex-1 py-3 border-2 border-white/20 text-white/60 text-sm font-bold uppercase tracking-wider hover:border-white/40 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            Limpiar
          </button>
          <button
            onClick={onPay}
            disabled={order.items.length === 0}
            className="flex-[2] py-3 bg-[#DC2626] border-2 border-white text-white text-sm font-bold uppercase tracking-wider hover:bg-red-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            Cobrar
          </button>
        </div>
      </div>
    </div>
  );
}
