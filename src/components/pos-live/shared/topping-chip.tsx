"use client";

import { cn } from "@/lib/utils";

interface ToppingChipProps {
  name: string;
  price: number;
  active: boolean;
  disabled?: boolean;
  variant?: "dark" | "light";
  onToggle: (active: boolean) => void;
}

export function ToppingChip({
  name,
  price,
  active,
  disabled,
  variant = "light",
  onToggle,
}: ToppingChipProps) {
  if (variant === "dark") {
    return (
      <button
        type="button"
        onClick={() => !disabled && onToggle(!active)}
        disabled={disabled}
        className={cn(
          "flex flex-col items-center justify-center gap-1 rounded-lg border-2 p-4 text-center transition-all active:scale-95",
          "min-h-[80px] min-w-[100px]",
          active
            ? "border-[#DC2626] bg-[#DC2626] text-white shadow-lg"
            : disabled
              ? "border-white/10 bg-white/5 text-white/20 cursor-not-allowed"
              : "border-white/20 bg-white/5 text-white hover:border-white/40 hover:bg-white/10"
        )}
      >
        <span className="text-sm font-bold leading-tight">{name}</span>
        {price > 0 && (
          <span
            className={cn(
              "text-xs",
              active ? "text-white/80" : "text-white/50"
            )}
          >
            +${(price ?? 0).toLocaleString()}
          </span>
        )}
      </button>
    );
  }

  // Light variant — compact for POS caja
  return (
    <button
      type="button"
      onClick={() => !disabled && onToggle(!active)}
      disabled={disabled}
      className={cn(
        "flex items-center gap-2 rounded-lg border-2 px-3 py-2 transition-all active:scale-95",
        active
          ? "border-red-600 bg-red-50 text-red-700"
          : disabled
            ? "cursor-not-allowed border-gray-100 bg-gray-50 text-gray-300"
            : "border-gray-200 bg-white text-gray-900 hover:border-gray-400"
      )}
    >
      <span className="text-sm font-extrabold leading-tight">{name}</span>
      {price > 0 && (
        <span className={cn("text-xs font-bold tabular-nums", active ? "text-red-500" : "text-gray-400")}>
          +${(price ?? 0).toLocaleString()}
        </span>
      )}
    </button>
  );
}
