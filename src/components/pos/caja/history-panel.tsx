"use client";

import { useState } from "react";
import { X, ChevronDown, ChevronUp } from "lucide-react";
import { useOrderHistory } from "@/lib/hooks/use-pos";

interface HistoryPanelProps {
  open: boolean;
  onClose: () => void;
}

interface SaleItem {
  name: string;
  price: number;
  quantity: number;
  modifiers?: { name: string; price: number; quantity: number }[];
}

export function HistoryPanel({ open, onClose }: HistoryPanelProps) {
  const { data: orders, isLoading } = useOrderHistory();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 z-40"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 bottom-0 w-96 max-w-[90vw] bg-white border-l border-gray-200 z-50 flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <span className="text-sm font-bold uppercase tracking-wider text-red-600">
            Historial de ventas
          </span>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-[#f7f5f2]">
          {isLoading ? (
            <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
              Cargando...
            </div>
          ) : !orders || orders.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
              Sin ventas registradas
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {orders.map((order) => {
                const isExpanded = expandedId === order.id;
                const items = (order.items || []) as SaleItem[];
                const date = order.closed_at
                  ? new Date(order.closed_at)
                  : new Date(order.created_at);

                return (
                  <li key={order.id}>
                    <button
                      onClick={() =>
                        setExpandedId(isExpanded ? null : order.id)
                      }
                      className="w-full text-left px-4 py-3 hover:bg-white transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-extrabold text-gray-900 tabular-nums">
                              ${Number(order.total).toLocaleString()}
                            </span>
                            <span className="text-gray-400 text-xs uppercase font-semibold">
                              {order.payment_method}
                            </span>
                            <span className="text-gray-300 text-xs">
                              {order.sale_type}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-gray-400 text-xs">
                              {date.toLocaleDateString("es-CO", {
                                day: "2-digit",
                                month: "short",
                              })}{" "}
                              {date.toLocaleTimeString("es-CO", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                            {order.cashier_name && (
                              <span className="text-gray-400 text-xs">
                                {order.cashier_name}
                              </span>
                            )}
                            <span className="text-gray-300 text-xs tabular-nums">
                              #{order.fudo_sale_id}
                            </span>
                          </div>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                        )}
                      </div>
                    </button>

                    {/* Expanded detail */}
                    {isExpanded && items.length > 0 && (
                      <div className="px-4 pb-3 space-y-2">
                        {items.map((item, idx) => (
                          <div
                            key={idx}
                            className="bg-white rounded-lg border border-gray-100 px-3 py-2"
                          >
                            <div className="flex justify-between text-gray-700 text-xs font-semibold">
                              <span>
                                {item.quantity}x {item.name}
                              </span>
                              <span className="font-bold tabular-nums">
                                ${(item.price * item.quantity).toLocaleString()}
                              </span>
                            </div>
                            {item.modifiers && item.modifiers.length > 0 && (
                              <div className="mt-1 space-y-0.5">
                                {item.modifiers.map((mod, midx) => (
                                  <div
                                    key={midx}
                                    className="flex justify-between text-gray-400 text-[11px] pl-3"
                                  >
                                    <span>+ {mod.name}</span>
                                    {mod.price > 0 && (
                                      <span className="tabular-nums">
                                        +${mod.price.toLocaleString()}
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}
