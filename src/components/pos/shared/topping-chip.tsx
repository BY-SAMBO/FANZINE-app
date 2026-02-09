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

  // Light variant — Diner Marquee style
  return (
    <button
      type="button"
      onClick={() => !disabled && onToggle(!active)}
      disabled={disabled}
      className={cn(
        "flex min-h-[140px] flex-col items-center justify-center gap-2.5 rounded-[14px] border-[1.5px] px-3 py-5 transition-all",
        active
          ? "border-[var(--pos-red)] bg-[var(--pos-red-dim)] shadow-[0_2px_16px_rgba(220,38,38,.08)]"
          : disabled
            ? "cursor-not-allowed opacity-[.18]"
            : "border-[var(--pos-border)] bg-white hover:border-[rgba(26,17,23,.18)] hover:bg-[var(--pos-surface)] hover:shadow-[0_2px_12px_rgba(0,0,0,.04)]"
      )}
    >
      {/* Image placeholder */}
      <div
        className={cn(
          "flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full text-[26px]",
          active
            ? "border-[1.5px] border-solid border-[var(--pos-red)] bg-[rgba(220,38,38,.04)]"
            : "border-[1.5px] border-dashed border-[var(--pos-border)] bg-[var(--pos-surface)]"
        )}
      >
        🌶️
      </div>

      <span
        className={cn(
          "text-center text-base font-bold leading-tight",
          active ? "text-[var(--pos-red)]" : "text-[var(--pos-dark)]"
        )}
      >
        {name}
      </span>

      {price > 0 && (
        <span
          className={cn(
            "font-[family-name:var(--font-dm-mono)] text-[11px]",
            active ? "text-[var(--pos-red)]" : "text-[var(--pos-muted)]"
          )}
        >
          +${(price ?? 0).toLocaleString()}
        </span>
      )}
    </button>
  );
}
