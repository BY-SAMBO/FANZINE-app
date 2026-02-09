"use client";

import type { OrderItem } from "@/types/pos";
import { MarqueeDots } from "./marquee-dots";

interface WaitingScreenProps {
  items: OrderItem[];
  total: number;
}

export function WaitingScreen({ items, total }: WaitingScreenProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-11 bg-white p-12">
      {/* Logo frame */}
      <div className="relative rounded-2xl border-2 border-[var(--pos-dark)] bg-white px-16 py-9 text-center">
        <MarqueeDots count={13} className="mb-5" />
        <p className="font-[family-name:var(--font-dm-mono)] text-xs font-medium uppercase tracking-[8px] text-[var(--pos-red)]">
          Presenta
        </p>
        <h1 className="mt-1.5 font-[family-name:var(--font-playfair)] text-[64px] font-black leading-none tracking-[6px] text-[var(--pos-dark)]">
          FANZINE
        </h1>
        <p className="mt-0.5 text-sm uppercase tracking-[8px] text-[var(--pos-muted)]">
          Cine & Tex-Mex
        </p>
        <div className="mx-auto mt-4 h-0.5 w-20 rounded-sm bg-[var(--pos-red)]" />
        <MarqueeDots count={13} className="mt-5" />
      </div>

      {/* Order summary */}
      {items.length > 0 && (
        <div className="w-full max-w-[520px] rounded-[14px] border border-[var(--pos-border)] bg-[var(--pos-surface)] px-8 py-7">
          <p className="mb-5 text-center font-[family-name:var(--font-dm-mono)] text-[10px] font-medium uppercase tracking-[4px] text-[var(--pos-red)]">
            Tu Orden
          </p>

          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-start justify-between border-b border-[var(--pos-border)] py-3 last:border-none"
            >
              <div>
                <p className="text-xl font-bold text-[var(--pos-dark)]">
                  {item.quantity > 1 && `${item.quantity}x `}
                  {item.name}
                </p>
                {item.modifiers.length > 0 && (
                  <div className="mt-1.5 flex flex-col gap-1">
                    {item.modifiers.map((mod) => (
                      <span
                        key={mod.fudo_modifier_id}
                        className="text-sm font-medium text-[var(--pos-dark)]/70"
                      >
                        + {mod.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <span className="shrink-0 font-[family-name:var(--font-dm-mono)] text-xs font-medium text-[var(--pos-muted)]">
                $
                {(
                  (item.price +
                    item.modifiers.reduce(
                      (s, m) => s + m.price * m.quantity,
                      0
                    )) *
                  item.quantity
                ).toLocaleString()}
              </span>
            </div>
          ))}

          <div className="mt-3.5 flex items-center justify-between border-t-2 border-[var(--pos-dark)] pt-4">
            <span className="font-[family-name:var(--font-dm-mono)] text-[11px] uppercase tracking-[3px] text-[var(--pos-muted)]">
              Total
            </span>
            <span className="font-[family-name:var(--font-dm-mono)] text-lg font-bold text-[var(--pos-dark)]">
              ${(total ?? 0).toLocaleString()}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
