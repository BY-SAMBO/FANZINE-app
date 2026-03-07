"use client";

import { WifiOff } from "lucide-react";

interface OfflineBadgeProps {
  pendingCount: number;
}

export function OfflineBadge({ pendingCount }: OfflineBadgeProps) {
  if (pendingCount === 0) return null;

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-50 border border-orange-200 rounded-lg text-orange-700 text-xs font-bold">
      <WifiOff className="w-3.5 h-3.5" />
      <span>{pendingCount} pedido{pendingCount > 1 ? "s" : ""} pendiente{pendingCount > 1 ? "s" : ""}</span>
    </div>
  );
}
