"use client";

import { usePosV2Store } from "@/lib/pos-v2/store";
import {
  classifyModifierGroups,
  upsellLabel,
} from "@/lib/pos-v2/modifier-classify";
import { cn } from "@/lib/utils";

export function ModifierPanel() {
  const toppingSelection = usePosV2Store((s) => s.toppingSelection);
  const toggleTopping = usePosV2Store((s) => s.toggleTopping);
  const confirmToppings = usePosV2Store((s) => s.confirmToppings);
  const cancelToppings = usePosV2Store((s) => s.cancelToppings);

  if (!toppingSelection) return null;

  const { groups, selected } = toppingSelection;
  const { premium, comboToggle, comboSub, normal } = classifyModifierGroups(groups);

  // Combo active?
  const isComboActive =
    comboToggle?.options.some((o) => selected[o.fudo_modifier_id]) ?? false;

  // Combo validation: each sub-group needs at least 1
  const comboValid =
    !isComboActive ||
    comboSub.every((g) =>
      g.options.some((o) => selected[o.fudo_modifier_id])
    );

  const hasSelection = Object.keys(selected).length > 0;

  const handleToggle = (modifierFudoId: string, active: boolean) => {
    toggleTopping(modifierFudoId, active);
  };

  // Deactivating combo also clears sub-selections
  const handleComboToggle = (modifierFudoId: string, active: boolean) => {
    if (!active) {
      for (const sg of comboSub) {
        for (const opt of sg.options) {
          if (selected[opt.fudo_modifier_id]) {
            handleToggle(opt.fudo_modifier_id, false);
          }
        }
      }
    }
    handleToggle(modifierFudoId, active);
  };

  // Grid columns for normal toppings
  const totalNormalOptions = normal.reduce((sum, g) => sum + g.options.length, 0);
  const cols = totalNormalOptions <= 4 ? 2 : totalNormalOptions <= 9 ? 3 : 4;

  return (
    <div className="flex flex-col h-full bg-[#f7f5f2] p-3 lg:p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 shrink-0">
        <div className="flex items-center gap-3">
          <h3 className="text-gray-900 font-extrabold text-sm uppercase tracking-wider">
            {toppingSelection.product_name}
          </h3>
          {normal.map((group) => {
            const selectedCount = group.options.filter(
              (o) => selected[o.fudo_modifier_id]
            ).length;
            const atMax = selectedCount >= group.max_quantity;
            return (
              <span
                key={group.fudo_id}
                className={cn(
                  "text-xs font-extrabold tabular-nums px-2.5 py-1 rounded-full",
                  atMax
                    ? "bg-red-100 text-red-600"
                    : selectedCount > 0
                      ? "bg-amber-100 text-amber-700"
                      : "bg-gray-200 text-gray-500"
                )}
              >
                {group.name} {selectedCount}/{group.max_quantity}
              </span>
            );
          })}
        </div>
        <div className="flex gap-2">
          <button
            onClick={cancelToppings}
            className="px-4 py-2 border-2 border-gray-200 text-gray-500 text-xs font-extrabold uppercase tracking-wider hover:text-gray-900 hover:border-gray-400 transition-all rounded-lg"
          >
            Cancelar
          </button>
          <button
            onClick={confirmToppings}
            disabled={!comboValid}
            className={cn(
              "px-6 py-2 bg-red-600 border-2 border-red-600 text-white text-xs font-extrabold uppercase tracking-wider hover:bg-red-700 hover:border-red-700 transition-all rounded-lg",
              !comboValid && "opacity-50 cursor-not-allowed",
              hasSelection && comboValid && "animate-pos-urgent"
            )}
          >
            Listo
          </button>
        </div>
      </div>

      {/* Premium + Combo upsell toggles */}
      {(premium.length > 0 || comboToggle) && (
        <div className="flex gap-3 mb-3 shrink-0">
          {premium.flatMap((group) =>
            group.options.map((opt) => {
              const isActive = !!selected[opt.fudo_modifier_id];
              return (
                <button
                  key={opt.fudo_modifier_id}
                  onClick={() => handleToggle(opt.fudo_modifier_id, !isActive)}
                  className={cn(
                    "upsell-btn flex-1 flex flex-col items-center justify-center rounded-xl py-4 px-4 cursor-pointer min-h-[72px]",
                    isActive
                      ? "upsell-btn-active bg-amber-400 text-amber-950"
                      : "bg-gradient-to-b from-amber-50 to-amber-100 text-amber-900"
                  )}
                >
                  <span className="text-base lg:text-lg font-black uppercase tracking-wide leading-tight">
                    {upsellLabel(opt.name)}
                  </span>
                  <span className="text-sm font-extrabold tabular-nums mt-1 bg-amber-900/10 px-2 py-0.5 rounded-full">
                    +${(opt.price ?? 0).toLocaleString()}
                  </span>
                </button>
              );
            })
          )}
          {comboToggle?.options.map((opt) => {
            const isActive = !!selected[opt.fudo_modifier_id];
            return (
              <button
                key={opt.fudo_modifier_id}
                onClick={() => handleComboToggle(opt.fudo_modifier_id, !isActive)}
                className={cn(
                  "upsell-btn flex-1 flex flex-col items-center justify-center rounded-xl py-4 px-4 cursor-pointer min-h-[72px]",
                  isActive
                    ? "upsell-btn-active bg-amber-400 text-amber-950"
                    : "bg-gradient-to-b from-amber-50 to-amber-100 text-amber-900"
                )}
              >
                <span className="text-base lg:text-lg font-black uppercase tracking-wide leading-tight">
                  COMBO
                </span>
                <span className="text-sm font-extrabold tabular-nums mt-1 bg-amber-900/10 px-2 py-0.5 rounded-full">
                  +${(opt.price ?? 0).toLocaleString()}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Combo sub-selections */}
      {isComboActive && comboSub.length > 0 && (
        <div className="border-2 border-amber-200 bg-amber-50/50 rounded-xl p-3 mb-3 shrink-0">
          {comboSub.map((group) => {
            const selectedCount = group.options.filter(
              (o) => selected[o.fudo_modifier_id]
            ).length;
            return (
              <div key={group.fudo_id} className="mb-2 last:mb-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-amber-800">
                    {group.name.replace(/^Combo\s*/i, "")}
                  </span>
                  <span
                    className={cn(
                      "text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                      selectedCount >= group.min_quantity
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-600"
                    )}
                  >
                    elige {group.min_quantity}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {group.options.map((opt) => {
                    const isActive = !!selected[opt.fudo_modifier_id];
                    const atMax = selectedCount >= group.max_quantity;
                    const isDisabled = atMax && !isActive;
                    return (
                      <button
                        key={opt.fudo_modifier_id}
                        onClick={() =>
                          !isDisabled && handleToggle(opt.fudo_modifier_id, !isActive)
                        }
                        disabled={isDisabled}
                        className={cn(
                          "px-3 py-1.5 rounded-lg border-2 text-xs font-extrabold transition-all active:scale-95",
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

      {/* Grid of normal topping buttons */}
      <div
        className="flex-1 grid gap-2"
        style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
      >
        {normal.flatMap((group) => {
          const selectedCount = group.options.filter(
            (o) => selected[o.fudo_modifier_id]
          ).length;
          const atMax = selectedCount >= group.max_quantity;

          return group.options.map((opt) => {
            const isActive = !!selected[opt.fudo_modifier_id];
            const isDisabled = atMax && !isActive;
            return (
              <button
                key={opt.fudo_modifier_id}
                onClick={() =>
                  !isDisabled && handleToggle(opt.fudo_modifier_id, !isActive)
                }
                disabled={isDisabled}
                className={cn(
                  "flex flex-col items-center justify-center rounded-xl border-2 transition-all active:scale-95 min-h-0",
                  isActive
                    ? "border-red-600 bg-red-50 text-red-700"
                    : isDisabled
                      ? "cursor-not-allowed border-gray-100 bg-gray-50 text-gray-300"
                      : "border-gray-200 bg-white text-gray-900 hover:border-gray-400"
                )}
              >
                <span className="text-base lg:text-lg font-extrabold leading-tight text-center">
                  {opt.name}
                </span>
                {opt.price > 0 && (
                  <span
                    className={cn(
                      "text-sm font-bold tabular-nums mt-1",
                      isActive ? "text-red-500" : "text-gray-400"
                    )}
                  >
                    +${(opt.price ?? 0).toLocaleString()}
                  </span>
                )}
              </button>
            );
          });
        })}
      </div>
    </div>
  );
}
