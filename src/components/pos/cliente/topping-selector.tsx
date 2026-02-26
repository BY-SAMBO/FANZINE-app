"use client";

import type { ModifierGroup } from "@/types/pos";
import { ToppingChip } from "@/components/pos/shared/topping-chip";
import { cn } from "@/lib/utils";

// --- Group classification helpers ---

function isPremiumGroup(g: ModifierGroup): boolean {
  return !g.name.startsWith("Combo") && g.options.some((o) => o.price > 0);
}

function isComboToggleGroup(g: ModifierGroup): boolean {
  if (!g.name.startsWith("Combo")) return false;
  // Toggle = has a priced option OR has no sub-type keyword (Acompañamiento/Bebida)
  if (g.options.some((o) => o.price > 0)) return true;
  const lower = g.name.toLowerCase();
  return !lower.includes("acompañamiento") && !lower.includes("bebida");
}

function isComboSubGroup(g: ModifierGroup): boolean {
  if (!g.name.startsWith("Combo")) return false;
  const lower = g.name.toLowerCase();
  return lower.includes("acompañamiento") || lower.includes("bebida");
}

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
  // Classify groups
  const premiumGroups = groups.filter(isPremiumGroup);
  const comboToggleGroup = groups.find(isComboToggleGroup) ?? null;
  const comboSubGroups = groups.filter(isComboSubGroup);
  const normalGroups = groups.filter(
    (g) => !isPremiumGroup(g) && !isComboToggleGroup(g) && !isComboSubGroup(g)
  );

  const isComboActive =
    comboToggleGroup?.options.some((o) => selected[o.fudo_modifier_id]) ?? false;

  // Progress only counts normal toppings
  const totalSelected = normalGroups.reduce(
    (s, g) => s + g.options.filter((o) => selected[o.fudo_modifier_id]).length,
    0
  );
  const totalMax = normalGroups.reduce((s, g) => s + g.max_quantity, 0);
  const progressPct =
    totalMax > 0 ? Math.min((totalSelected / totalMax) * 100, 100) : 0;
  const isFull = totalSelected >= totalMax;

  const handleComboToggle = (modifierFudoId: string, active: boolean) => {
    if (!active) {
      for (const sg of comboSubGroups) {
        for (const opt of sg.options) {
          if (selected[opt.fudo_modifier_id]) {
            onToggle(opt.fudo_modifier_id, false);
          }
        }
      }
    }
    onToggle(modifierFudoId, active);
  };

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

        {/* Progress bar + pill (only normal toppings) */}
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
        {/* Premium + Combo toggles */}
        {(premiumGroups.length > 0 || comboToggleGroup) && (
          <div className="mb-6 grid grid-cols-2 gap-3">
            {premiumGroups.flatMap((group) =>
              group.options.map((opt) => {
                const isActive = !!selected[opt.fudo_modifier_id];
                return (
                  <button
                    key={opt.fudo_modifier_id}
                    type="button"
                    onClick={() => onToggle(opt.fudo_modifier_id, !isActive)}
                    className={cn(
                      "flex flex-col items-center justify-center gap-1 rounded-xl border-2 py-4 px-6 transition-all active:scale-95",
                      isActive
                        ? "border-amber-500 bg-amber-400 text-amber-900 shadow-lg"
                        : "border-amber-300 bg-amber-50 text-amber-800 hover:border-amber-400 hover:bg-amber-100"
                    )}
                  >
                    <span className="font-[family-name:var(--font-playfair)] text-lg font-bold">
                      Con {opt.name}
                    </span>
                    <span
                      className={cn(
                        "font-[family-name:var(--font-dm-mono)] text-sm font-bold",
                        isActive ? "text-amber-700" : "text-amber-600"
                      )}
                    >
                      +${(opt.price ?? 0).toLocaleString()}
                    </span>
                  </button>
                );
              })
            )}
            {comboToggleGroup?.options.map((opt) => {
              const isActive = !!selected[opt.fudo_modifier_id];
              return (
                <button
                  key={opt.fudo_modifier_id}
                  type="button"
                  onClick={() =>
                    handleComboToggle(opt.fudo_modifier_id, !isActive)
                  }
                  className={cn(
                    "flex flex-col items-center justify-center gap-1 rounded-xl border-2 py-4 px-6 transition-all active:scale-95",
                    isActive
                      ? "border-amber-500 bg-amber-400 text-amber-900 shadow-lg"
                      : "border-amber-300 bg-amber-50 text-amber-800 hover:border-amber-400 hover:bg-amber-100"
                  )}
                >
                  <span className="font-[family-name:var(--font-playfair)] text-lg font-bold">
                    Combo
                  </span>
                  <span
                    className={cn(
                      "font-[family-name:var(--font-dm-mono)] text-sm font-bold",
                      isActive ? "text-amber-700" : "text-amber-600"
                    )}
                  >
                    +${(opt.price ?? 0).toLocaleString()}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Combo sub-selections (conditional) */}
        {isComboActive && comboSubGroups.length > 0 && (
          <div className="mb-6 rounded-xl border-2 border-amber-200 bg-amber-50/50 p-5">
            {comboSubGroups.map((group) => {
              const selectedCount = group.options.filter(
                (o) => selected[o.fudo_modifier_id]
              ).length;
              const atMax = selectedCount >= group.max_quantity;

              return (
                <div key={group.fudo_id} className="mb-4 last:mb-0">
                  <div className="mb-2.5 flex items-center gap-2">
                    <h3 className="font-[family-name:var(--font-dm-mono)] text-[10px] font-medium uppercase tracking-[4px] text-amber-700">
                      {group.name.replace(/^Combo\s*/i, "")}
                    </h3>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-bold",
                        selectedCount >= group.min_quantity
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-600"
                      )}
                    >
                      elige {group.min_quantity}
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-3">
                    {group.options.map((opt) => {
                      const isActive = !!selected[opt.fudo_modifier_id];
                      const isDisabled = atMax && !isActive;
                      return (
                        <button
                          key={opt.fudo_modifier_id}
                          type="button"
                          onClick={() =>
                            !isDisabled &&
                            onToggle(opt.fudo_modifier_id, !isActive)
                          }
                          disabled={isDisabled}
                          className={cn(
                            "flex items-center justify-center rounded-lg border-2 px-3 py-2.5 text-sm font-bold transition-all active:scale-95",
                            isActive
                              ? "border-amber-500 bg-amber-400 text-amber-900"
                              : isDisabled
                                ? "cursor-not-allowed border-gray-100 bg-gray-50 text-gray-300"
                                : "border-amber-200 bg-white text-amber-800 hover:border-amber-300"
                          )}
                        >
                          {opt.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Normal toppings */}
        {normalGroups.map((group) => {
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
