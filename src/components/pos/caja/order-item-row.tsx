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
    <div className="border-b border-white/10 py-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white truncate">{item.name}</p>
          {item.modifiers.length > 0 && (
            <p className="text-xs text-white/50 truncate">
              {item.modifiers.map((m) => m.name).join(", ")}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onUpdateQuantity(Math.max(1, item.quantity - 1))}
            className="w-6 h-6 flex items-center justify-center text-white/50 hover:text-white bg-white/5 hover:bg-white/10 rounded"
          >
            <Minus className="w-3 h-3" />
          </button>
          <span className="text-white text-sm font-bold w-5 text-center">
            {item.quantity}
          </span>
          <button
            onClick={() => onUpdateQuantity(item.quantity + 1)}
            className="w-6 h-6 flex items-center justify-center text-white/50 hover:text-white bg-white/5 hover:bg-white/10 rounded"
          >
            <Plus className="w-3 h-3" />
          </button>
          <span className="text-white text-sm font-medium w-16 text-right">
            ${lineTotal.toLocaleString()}
          </span>
          <button
            onClick={onRemove}
            className="w-6 h-6 flex items-center justify-center text-white/30 hover:text-red-400 rounded"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
