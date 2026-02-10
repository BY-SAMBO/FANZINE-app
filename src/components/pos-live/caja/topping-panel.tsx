"use client";

import { usePosStore } from "@/lib/stores/pos-live-store";
import { cn } from "@/lib/utils";
import type { PosEvent } from "@/types/pos";

interface ToppingPanelProps {
  onSend: (event: PosEvent) => void;
}

export function ToppingPanel({ onSend }: ToppingPanelProps) {
  const { toppingSelection, toggleTopping, confirmToppings, cancelToppings } =
    usePosStore();

  if (!toppingSelection) return null;

  const handleToggle = (modifierFudoId: string, active: boolean) => {
    toggleTopping(modifierFudoId, active);

    const group = toppingSelection.groups.find((g) =>
      g.options.some((o) => o.fudo_modifier_id === modifierFudoId)
    );

    onSend({
      type: "topping_toggled",
      modifier_fudo_id: modifierFudoId,
      modifier_group_fudo_id: group?.fudo_id || "",
      active,
    });
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

  // Count total options across all groups for grid sizing
  const totalOptions = toppingSelection.groups.reduce(
    (sum, g) => sum + g.options.length,
    0
  );
  // Pick columns: aim for fewest rows while keeping buttons wide
  const cols = totalOptions <= 4 ? 2 : totalOptions <= 9 ? 3 : 4;

  return (
    <div className="flex flex-col h-full bg-[#f7f5f2] p-3 lg:p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 shrink-0">
        <div className="flex items-center gap-3">
          <h3 className="text-gray-900 font-extrabold text-sm uppercase tracking-wider">
            {toppingSelection.product_name}
          </h3>
          {toppingSelection.groups.map((group) => {
            const selectedCount = group.options.filter(
              (o) => toppingSelection.selected[o.fudo_modifier_id]
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
            className="px-6 py-2 bg-red-600 border-2 border-red-600 text-white text-xs font-extrabold uppercase tracking-wider hover:bg-red-700 hover:border-red-700 transition-all rounded-lg"
          >
            Listo
          </button>
        </div>
      </div>

      {/* Grid of topping buttons — fills remaining space, no scroll */}
      <div
        className="flex-1 grid gap-2"
        style={{
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
        }}
      >
        {toppingSelection.groups.flatMap((group) => {
          const selectedCount = group.options.filter(
            (o) => toppingSelection.selected[o.fudo_modifier_id]
          ).length;
          const atMax = selectedCount >= group.max_quantity;

          return group.options.map((opt) => {
            const isActive = !!toppingSelection.selected[opt.fudo_modifier_id];
            const isDisabled = atMax && !isActive;
            return (
              <button
                key={opt.fudo_modifier_id}
                onClick={() => !isDisabled && handleToggle(opt.fudo_modifier_id, !isActive)}
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
                  <span className={cn(
                    "text-sm font-bold tabular-nums mt-1",
                    isActive ? "text-red-500" : "text-gray-400"
                  )}>
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
