"use client";

import { usePosStore } from "@/lib/stores/pos-store";
import { cn } from "@/lib/utils";
import type { ModifierGroup, PosEvent } from "@/types/pos";

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

interface ToppingPanelProps {
  onSend: (event: PosEvent) => void;
}

export function ToppingPanel({ onSend }: ToppingPanelProps) {
  const toppingSelection = usePosStore((s) => s.toppingSelection);
  const toggleTopping = usePosStore((s) => s.toggleTopping);
  const confirmToppings = usePosStore((s) => s.confirmToppings);
  const cancelToppings = usePosStore((s) => s.cancelToppings);

  if (!toppingSelection) return null;

  const { groups, selected } = toppingSelection;

  // Classify groups
  const premiumGroups = groups.filter(isPremiumGroup);
  const comboToggleGroup = groups.find(isComboToggleGroup) ?? null;
  const comboSubGroups = groups.filter(isComboSubGroup);
  const normalGroups = groups.filter(
    (g) => !isPremiumGroup(g) && !isComboToggleGroup(g) && !isComboSubGroup(g)
  );

  // Combo active?
  const isComboActive =
    comboToggleGroup?.options.some((o) => selected[o.fudo_modifier_id]) ?? false;

  // Validation: combo sub-selections must each have 1 picked
  const comboValid =
    !isComboActive ||
    comboSubGroups.every((g) =>
      g.options.some((o) => selected[o.fudo_modifier_id])
    );

  const hasSelection = Object.keys(selected).length > 0;

  const handleToggle = (modifierFudoId: string, active: boolean) => {
    toggleTopping(modifierFudoId, active);

    const group = groups.find((g) =>
      g.options.some((o) => o.fudo_modifier_id === modifierFudoId)
    );

    onSend({
      type: "topping_toggled",
      modifier_fudo_id: modifierFudoId,
      modifier_group_fudo_id: group?.fudo_id || "",
      active,
    });
  };

  // When deactivating combo toggle, also clear combo sub-selections
  const handleComboToggle = (modifierFudoId: string, active: boolean) => {
    if (!active) {
      // Deselect all combo sub-group options
      for (const sg of comboSubGroups) {
        for (const opt of sg.options) {
          if (selected[opt.fudo_modifier_id]) {
            handleToggle(opt.fudo_modifier_id, false);
          }
        }
      }
    }
    handleToggle(modifierFudoId, active);
  };

  const handleConfirm = () => {
    onSend({
      type: "toppings_confirmed",
      selected: toppingSelection.selected,
    });
    confirmToppings();
  };

  const handleCancel = () => {
    onSend({
      type: "toppings_confirmed",
      selected: {},
    });
    cancelToppings();
  };

  // Grid columns for normal toppings
  const totalNormalOptions = normalGroups.reduce(
    (sum, g) => sum + g.options.length,
    0
  );
  const cols = totalNormalOptions <= 4 ? 2 : totalNormalOptions <= 9 ? 3 : 4;

  // Header badges only for normal groups
  const headerBadgeGroups = normalGroups;

  return (
    <div className="flex flex-col h-full bg-[#f7f5f2] p-3 lg:p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 shrink-0">
        <div className="flex items-center gap-3">
          <h3 className="text-gray-900 font-extrabold text-sm uppercase tracking-wider">
            {toppingSelection.product_name}
          </h3>
          {headerBadgeGroups.map((group) => {
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
            onClick={handleCancel}
            className="px-4 py-2 border-2 border-gray-200 text-gray-500 text-xs font-extrabold uppercase tracking-wider hover:text-gray-900 hover:border-gray-400 transition-all rounded-lg"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
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

      {/* Premium + Combo toggles */}
      {(premiumGroups.length > 0 || comboToggleGroup) && (
        <div className="flex gap-2 mb-3 shrink-0">
          {premiumGroups.flatMap((group) =>
            group.options.map((opt) => {
              const isActive = !!selected[opt.fudo_modifier_id];
              return (
                <button
                  key={opt.fudo_modifier_id}
                  onClick={() =>
                    handleToggle(opt.fudo_modifier_id, !isActive)
                  }
                  className={cn(
                    "flex-1 flex flex-col items-center justify-center rounded-xl border-2 py-3 px-4 transition-all active:scale-95 min-h-[60px]",
                    isActive
                      ? "border-amber-500 bg-amber-400 text-amber-900 shadow-md"
                      : "border-amber-300 bg-amber-50 text-amber-800 hover:border-amber-400 hover:bg-amber-100"
                  )}
                >
                  <span className="text-sm lg:text-base font-extrabold uppercase leading-tight">
                    Con {opt.name}
                  </span>
                  <span
                    className={cn(
                      "text-xs font-bold tabular-nums mt-0.5",
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
                onClick={() =>
                  handleComboToggle(opt.fudo_modifier_id, !isActive)
                }
                className={cn(
                  "flex-1 flex flex-col items-center justify-center rounded-xl border-2 py-3 px-4 transition-all active:scale-95 min-h-[60px]",
                  isActive
                    ? "border-amber-500 bg-amber-400 text-amber-900 shadow-md"
                    : "border-amber-300 bg-amber-50 text-amber-800 hover:border-amber-400 hover:bg-amber-100"
                )}
              >
                <span className="text-sm lg:text-base font-extrabold uppercase leading-tight">
                  Combo
                </span>
                <span
                  className={cn(
                    "text-xs font-bold tabular-nums mt-0.5",
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
        <div className="border-2 border-amber-200 bg-amber-50/50 rounded-xl p-3 mb-3 shrink-0">
          {comboSubGroups.map((group) => {
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
                          !isDisabled &&
                          handleToggle(opt.fudo_modifier_id, !isActive)
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

      {/* Grid of normal topping buttons — fills remaining space */}
      <div
        className="flex-1 grid gap-2"
        style={{
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
        }}
      >
        {normalGroups.flatMap((group) => {
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
                  !isDisabled &&
                  handleToggle(opt.fudo_modifier_id, !isActive)
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
