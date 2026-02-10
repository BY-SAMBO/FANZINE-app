"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useOrderHistory } from "@/lib/hooks/use-pos";

interface SaleItem {
  name: string;
  price: number;
  quantity: number;
  modifiers?: { name: string; price: number; quantity: number }[];
}

const METHOD_SHORT: Record<string, string> = {
  cash: "Efvo",
  card: "Tarj",
  nequi: "Nequi",
  daviplata: "Davi",
  llaves: "Llav",
};

interface MiniHistoryProps {
  highlightId?: string | null;
  onOpenFull?: () => void;
}

export function MiniHistory({ highlightId, onOpenFull }: MiniHistoryProps) {
  const { data: orders } = useOrderHistory();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const recent = orders?.slice(0, 8) ?? [];

  if (recent.length === 0) {
    return (
      <div className="text-center text-gray-300 text-[11px] py-3">
        Sin ventas recientes
      </div>
    );
  }

  return (
    <div className="flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-3 pt-2 pb-1">
        <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400">
          Recientes
        </span>
        {onOpenFull && (
          <button
            onClick={onOpenFull}
            className="text-[10px] font-semibold text-red-600 hover:text-red-700 transition-colors"
          >
            Ver todo
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {recent.map((order) => {
          const isExpanded = expandedId === order.id;
          const isHighlighted = highlightId === order.fudo_sale_id;
          const items = (order.items || []) as SaleItem[];
          const date = order.closed_at
            ? new Date(order.closed_at)
            : new Date(order.created_at);
          const time = date.toLocaleTimeString("es-CO", {
            hour: "2-digit",
            minute: "2-digit",
          });

          return (
            <div
              key={order.id}
              className={
                isHighlighted ? "animate-sale-success" : ""
              }
            >
              <button
                onClick={() => setExpandedId(isExpanded ? null : order.id)}
                className="w-full text-left px-3 py-1.5 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-2 text-[11px]">
                  <span className="text-gray-400 tabular-nums shrink-0">
                    {time}
                  </span>
                  <span className="font-extrabold text-gray-900 tabular-nums shrink-0">
                    ${Number(order.total).toLocaleString()}
                  </span>
                  <span className="text-gray-400 font-semibold uppercase text-[10px] truncate">
                    {METHOD_SHORT[order.payment_method] || order.payment_method}
                  </span>
                  <span className="ml-auto shrink-0">
                    {isExpanded ? (
                      <ChevronUp className="w-3 h-3 text-gray-300" />
                    ) : (
                      <ChevronDown className="w-3 h-3 text-gray-300" />
                    )}
                  </span>
                </div>
              </button>

              {isExpanded && items.length > 0 && (
                <div className="px-3 pb-1.5 space-y-0.5">
                  {items.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between text-[10px] text-gray-500 pl-2"
                    >
                      <span className="truncate">
                        {item.quantity}x {item.name}
                      </span>
                      <span className="tabular-nums font-semibold shrink-0 ml-1">
                        ${(item.price * item.quantity).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
