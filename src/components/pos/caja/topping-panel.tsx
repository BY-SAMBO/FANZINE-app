"use client";

import { usePosStore } from "@/lib/stores/pos-store";
import { ToppingChip } from "@/components/pos/shared/topping-chip";
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

    // Find the group for this modifier
    const group = toppingSelection.groups.find((g) =>
      g.options.some((o) => o.fudo_modifier_id === modifierFudoId)
    );

    // Broadcast to client screen
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

  return (
    <div className="flex flex-col border-t-2 border-red-600 bg-white/95 p-4 gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-gray-900 font-bold text-sm uppercase tracking-wider">
          Toppings: {toppingSelection.product_name}
        </h3>
        <div className="flex gap-2">
          <button
            onClick={handleCancel}
            className="px-3 py-1.5 border border-gray-200 text-gray-500 text-xs font-bold uppercase hover:text-gray-900 hover:border-gray-400 transition-all rounded-lg"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            className="px-3 py-1.5 bg-red-600 border border-red-600 text-white text-xs font-bold uppercase hover:bg-red-700 transition-all rounded-lg"
          >
            Listo
          </button>
        </div>
      </div>

      <div className="overflow-y-auto max-h-48 space-y-3">
        {toppingSelection.groups.map((group) => {
          const selectedCount = group.options.filter(
            (o) => toppingSelection.selected[o.fudo_modifier_id]
          ).length;
          const atMax = selectedCount >= group.max_quantity;

          return (
            <div key={group.fudo_id}>
              <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">
                {group.name}{" "}
                <span className={atMax ? "text-red-600" : "text-gray-300"}>
                  ({selectedCount}/{group.max_quantity})
                </span>
              </p>
              <div className="flex flex-wrap gap-2">
                {group.options.map((opt) => {
                  const isActive = !!toppingSelection.selected[opt.fudo_modifier_id];
                  return (
                    <ToppingChip
                      key={opt.fudo_modifier_id}
                      name={opt.name}
                      price={opt.price}
                      active={isActive}
                      disabled={atMax && !isActive}
                      variant="light"
                      onToggle={(active) => handleToggle(opt.fudo_modifier_id, active)}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
