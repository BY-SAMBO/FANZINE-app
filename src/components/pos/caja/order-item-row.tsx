"use client";

import { Minus, Plus, X } from "lucide-react";
import type { OrderItem } from "@/types/pos";

interface OrderItemRowProps {
  item: OrderItem;
  onUpdateQuantity: (quantity: number) => void;
  onRemove: () => void;
}

export function OrderItemRow({ item, onUpdateQuantity, onRemove }: OrderItemRowProps) {
  const modTotal = item.modifiers.reduce((s, m) => s + m.price * m.quantity, 0);
  const lineTotal = (item.price + modTotal) * item.quantity;

  return (
    <div className="flex items-center gap-2 py-2.5 border-b border-gray-100">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-extrabold text-gray-900 truncate">{item.name}</p>
        {item.modifiers.length > 0 && (
          <p className="text-xs font-medium text-gray-400 truncate">
            {item.modifiers.map((m) => m.name).join(", ")}
          </p>
        )}
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onUpdateQuantity(Math.max(1, item.quantity - 1))}
          className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-900 text-xs font-bold"
        >
          <Minus className="w-3 h-3" />
        </button>
        <span className="text-sm font-extrabold text-gray-900 w-5 text-center tabular-nums">
          {item.quantity}
        </span>
        <button
          onClick={() => onUpdateQuantity(item.quantity + 1)}
          className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-900 text-xs font-bold"
        >
          <Plus className="w-3 h-3" />
        </button>
      </div>
      <span className="text-sm font-extrabold text-gray-800 w-20 text-right tabular-nums">
        ${lineTotal.toLocaleString()}
      </span>
      <button
        onClick={onRemove}
        className="w-6 h-6 flex items-center justify-center text-gray-300 hover:text-red-600 transition-colors"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
