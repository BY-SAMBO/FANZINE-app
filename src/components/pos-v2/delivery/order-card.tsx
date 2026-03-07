"use client";

import { cn } from "@/lib/utils";
import type { RemoteOrderLog } from "@/types/pos-v2";
import {
  Clock,
  Check,
  X,
  ChefHat,
  Package,
} from "lucide-react";

const STATUS_CONFIG: Record<
  string,
  { label: string; icon: typeof Clock; color: string; bg: string; ring: string }
> = {
  sent: {
    label: "Enviado",
    icon: Clock,
    color: "text-blue-600",
    bg: "bg-blue-50 border-blue-200",
    ring: "ring-blue-400",
  },
  confirmed: {
    label: "Confirmado",
    icon: Check,
    color: "text-emerald-600",
    bg: "bg-emerald-50 border-emerald-200",
    ring: "ring-emerald-400",
  },
  rejected: {
    label: "Rechazado",
    icon: X,
    color: "text-red-600",
    bg: "bg-red-50 border-red-200",
    ring: "ring-red-400",
  },
  ready: {
    label: "Listo para entregar",
    icon: ChefHat,
    color: "text-amber-600",
    bg: "bg-amber-50 border-amber-200",
    ring: "ring-amber-400",
  },
  closed: {
    label: "Cerrado",
    icon: Package,
    color: "text-gray-500",
    bg: "bg-gray-50 border-gray-200",
    ring: "ring-gray-400",
  },
  error: {
    label: "Error",
    icon: X,
    color: "text-red-600",
    bg: "bg-red-50 border-red-200",
    ring: "ring-red-400",
  },
};

export { STATUS_CONFIG };

interface OrderCardProps {
  order: RemoteOrderLog;
  isFlashing: boolean;
}

export function OrderCard({ order, isFlashing }: OrderCardProps) {
  const config = STATUS_CONFIG[order.status] || STATUS_CONFIG.sent;
  const Icon = config.icon;
  const time = new Date(order.created_at).toLocaleTimeString("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div
      className={cn(
        "rounded-xl border p-4 transition-all duration-300",
        "bg-white/5 border-white/10",
        isFlashing && "animate-pulse ring-2 ring-offset-2 ring-offset-[#0f1117]",
        isFlashing && config.ring
      )}
    >
      {/* Top row: status + time */}
      <div className="flex items-center justify-between mb-3">
        <div
          className={cn(
            "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-extrabold border",
            config.bg,
            config.color
          )}
        >
          <Icon className="w-3.5 h-3.5" />
          {config.label}
        </div>
        <span className="text-xs text-white/30 tabular-nums font-mono">{time}</span>
      </div>

      {/* Order info */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-sm font-extrabold text-white">
            {order.customer_name || "Sin nombre"}
          </span>
          <span className="text-lg font-extrabold text-white tabular-nums">
            ${Number(order.total + order.delivery_fee).toLocaleString()}
          </span>
        </div>

        <div className="flex items-center justify-between text-xs text-white/40">
          <span className="font-semibold">{order.location_name}</span>
          {order.fudo_order_id && (
            <span className="font-mono">#{order.fudo_order_id}</span>
          )}
        </div>

        {Number(order.delivery_fee) > 0 && (
          <div className="text-[10px] text-white/25">
            Delivery: ${Number(order.delivery_fee).toLocaleString()}
          </div>
        )}
      </div>
    </div>
  );
}
