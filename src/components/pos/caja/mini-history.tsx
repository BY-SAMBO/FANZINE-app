"use client";

import { useState } from "react";
import { useOrderHistory } from "@/lib/hooks/use-pos";
import { SaleDetailDialog } from "./sale-detail-dialog";
import { cn } from "@/lib/utils";

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
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const recent = orders?.slice(0, 8) ?? [];
  const selectedOrder = recent.find((o) => o.id === selectedOrderId) ?? null;

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
          const isHighlighted = highlightId === order.fudo_sale_id;
          const isOpen = order.sale_status === "open";
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
              className={isHighlighted ? "animate-sale-success" : ""}
            >
              <button
                onClick={() => setSelectedOrderId(order.id)}
                className="w-full text-left px-3 py-1.5 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-2 text-[11px]">
                  <span className="text-gray-400 tabular-nums shrink-0">
                    {time}
                  </span>
                  {isOpen && (
                    <span className="shrink-0 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-yellow-100 text-yellow-700 rounded animate-pulse">
                      Abierta
                    </span>
                  )}
                  {order.sale_status === "cancelled" && (
                    <span className="shrink-0 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-red-100 text-red-600 rounded">
                      Cancelada
                    </span>
                  )}
                  <span className={cn(
                    "font-extrabold tabular-nums shrink-0",
                    order.sale_status === "cancelled" ? "text-gray-400 line-through" : "text-gray-900"
                  )}>
                    ${Number(order.total).toLocaleString()}
                  </span>
                  {!isOpen && order.sale_status !== "cancelled" && (
                    <span className="text-gray-400 font-semibold uppercase text-[10px] truncate">
                      {METHOD_SHORT[order.payment_method] || order.payment_method}
                    </span>
                  )}
                </div>
              </button>
            </div>
          );
        })}
      </div>

      {/* Sale detail popup */}
      {selectedOrder && (
        <SaleDetailDialog
          order={selectedOrder}
          onClose={() => setSelectedOrderId(null)}
        />
      )}
    </div>
  );
}
