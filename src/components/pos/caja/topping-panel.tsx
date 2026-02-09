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
    <div className="flex flex-col border-t-2 border-[#DC2626] bg-[#1a1117]/95 p-4 gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-bold text-sm uppercase tracking-wider">
          Toppings: {toppingSelection.product_name}
        </h3>
        <div className="flex gap-2">
          <button
            onClick={handleCancel}
            className="px-3 py-1.5 border border-white/20 text-white/60 text-xs font-bold uppercase hover:text-white hover:border-white/40 transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            className="px-3 py-1.5 bg-[#DC2626] border border-white text-white text-xs font-bold uppercase hover:bg-red-700 transition-all"
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
              <p className="text-white/40 text-xs font-bold uppercase tracking-wider mb-2">
                {group.name}{" "}
                <span className={atMax ? "text-[#DC2626]" : "text-white/30"}>
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
                      variant="dark"
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
