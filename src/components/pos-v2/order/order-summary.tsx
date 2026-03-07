"use client";

import type { OrderItem } from "@/types/pos-v2";

interface OrderSummaryProps {
  items: OrderItem[];
  total: number;
}

export function OrderSummary({ items, total }: OrderSummaryProps) {
  return (
    <div className="space-y-2">
      {items.map((item) => {
        const modTotal = item.modifiers.reduce((s, m) => s + m.price * m.quantity, 0);
        const lineTotal = (item.price + modTotal) * item.quantity;
        return (
          <div key={item.id}>
            <div className="flex justify-between text-sm">
              <span className="font-bold text-gray-900">
                {item.quantity}x {item.name}
              </span>
              <span className="font-extrabold text-gray-900 tabular-nums">
                ${lineTotal.toLocaleString()}
              </span>
            </div>
            {item.modifiers.length > 0 && (
              <div className="mt-0.5 space-y-0.5">
                {item.modifiers.map((mod, idx) => (
                  <div key={idx} className="flex justify-between text-xs text-gray-400 pl-4">
                    <span>+ {mod.name}</span>
                    {mod.price > 0 && (
                      <span className="tabular-nums">+${mod.price.toLocaleString()}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
      <div className="flex justify-between items-center pt-2 border-t border-gray-100">
        <span className="text-lg font-extrabold text-gray-900">Total</span>
        <span className="text-2xl font-extrabold text-gray-900 tabular-nums">
          ${total.toLocaleString()}
        </span>
      </div>
    </div>
  );
}
