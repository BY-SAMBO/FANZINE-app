"use client";

import type { ModifierGroup } from "@/types/pos";
import { ToppingChip } from "@/components/pos-live/shared/topping-chip";

interface ToppingSelectorProps {
  productName: string;
  groups: ModifierGroup[];
  selected: Record<string, number>;
  onToggle: (modifierFudoId: string, active: boolean) => void;
}

export function ToppingSelector({
  productName,
  groups,
  selected,
  onToggle,
}: ToppingSelectorProps) {
  // Total selected / total max across all groups
  const totalSelected = Object.keys(selected).length;
  const totalMax = groups.reduce((s, g) => s + g.max_quantity, 0);
  const progressPct = totalMax > 0 ? Math.min((totalSelected / totalMax) * 100, 100) : 0;
  const isFull = totalSelected >= totalMax;

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-[var(--pos-border)] px-8 py-4">
        <div className="flex items-center gap-3.5">
          <div className="flex h-[42px] w-[42px] items-center justify-center rounded-[11px] bg-[var(--pos-red)] text-xl">
            🌶️
          </div>
          <div>
            <p className="font-[family-name:var(--font-dm-mono)] text-[10px] font-medium uppercase tracking-[3px] text-[var(--pos-red)]">
              Personaliza tu
            </p>
            <h2 className="font-[family-name:var(--font-playfair)] text-[22px] font-bold text-[var(--pos-dark)]">
              {productName}
            </h2>
          </div>
        </div>

        {/* Progress bar + pill */}
        <div className="flex items-center gap-3">
          <div className="h-1 w-[100px] overflow-hidden rounded-sm bg-[var(--pos-border)]">
            <div
              className="h-full rounded-sm bg-[var(--pos-red)] transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <span
            className={`rounded-lg border-[1.5px] px-3.5 py-1 font-[family-name:var(--font-dm-mono)] text-xs font-bold ${
              isFull
                ? "border-[var(--pos-red)] text-[var(--pos-red)]"
                : "border-[var(--pos-border)] text-[var(--pos-dark)]"
            }`}
          >
            {totalSelected} / {totalMax}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        {groups.map((group) => {
          const selectedCount = group.options.filter(
            (o) => selected[o.fudo_modifier_id]
          ).length;
          const atMax = selectedCount >= group.max_quantity;

          return (
            <div key={group.fudo_id} className="mb-6 last:mb-0">
              <h3 className="mb-4 font-[family-name:var(--font-dm-mono)] text-[10px] font-medium uppercase tracking-[4px] text-[var(--pos-red)]">
                {group.name}
              </h3>
              <div className="grid grid-cols-4 gap-3.5">
                {group.options.map((opt) => {
                  const isActive = !!selected[opt.fudo_modifier_id];
                  return (
                    <ToppingChip
                      key={opt.fudo_modifier_id}
                      name={opt.name}
                      price={opt.price}
                      active={isActive}
                      disabled={atMax && !isActive}
                      variant="light"
                      onToggle={(active) =>
                        onToggle(opt.fudo_modifier_id, active)
                      }
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer hint */}
      <div className="shrink-0 border-t border-[var(--pos-border)] px-8 py-3.5 text-center">
        <span className="text-xs text-[var(--pos-muted)]">
          Toca para seleccionar tus toppings
        </span>
      </div>
    </div>
  );
}
