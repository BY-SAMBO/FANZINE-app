"use client";

import { usePosStore } from "@/lib/stores/pos-store";
import { Clock } from "lucide-react";
import { OrderItemRow } from "./order-item-row";

interface OrderPanelProps {
  onPay: () => void;
  onHistoryOpen?: () => void;
}

export function OrderPanel({ onPay, onHistoryOpen }: OrderPanelProps) {
  const { order, removeItem, updateItemQuantity, clearOrder } =
    usePosStore();

  const totalItems = order.items.reduce((s, i) => s + i.quantity, 0);

  return (
    <div className="flex h-full flex-col bg-white border-l border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-3 border-b border-gray-200">
        <div className="w-8" />
        <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-red-600">
          Para llevar
        </span>
        <button
          onClick={onHistoryOpen}
          title="Historial de ordenes"
          className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-600 hover:bg-gray-50 transition-all"
        >
          <Clock className="w-4 h-4" />
        </button>
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
        {order.items.length === 0 ? (
          <div className="flex h-full items-center justify-center text-gray-300 text-sm">
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
      <div className="border-t border-gray-200 p-4 space-y-3">
        <div className="flex justify-between text-gray-400 text-xs">
          <span>{totalItems} items</span>
          <span className="tabular-nums">{order.items.length} productos</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xl font-extrabold text-gray-900">Total</span>
          <span className="text-3xl font-extrabold text-gray-900 tabular-nums">
            ${(order.total ?? 0).toLocaleString()}
          </span>
        </div>

        <div className="flex gap-2">
          <button
            onClick={clearOrder}
            disabled={order.items.length === 0}
            className="flex-1 py-3.5 border-2 border-gray-200 text-gray-500 text-sm font-extrabold uppercase tracking-wider hover:border-gray-400 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed transition-all rounded-lg"
          >
            Limpiar
          </button>
          <button
            onClick={onPay}
            disabled={order.items.length === 0}
            className="flex-[2] py-3.5 bg-red-600 border-2 border-red-600 text-white text-sm font-extrabold uppercase tracking-wider hover:bg-red-700 hover:border-red-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all rounded-lg"
          >
            Cobrar
          </button>
        </div>
      </div>
    </div>
  );
}
