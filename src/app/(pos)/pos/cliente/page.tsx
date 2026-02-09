"use client";

import { useState, useCallback } from "react";
import { usePosChannel } from "@/lib/hooks/use-pos-channel";
import { WaitingScreen } from "@/components/pos/cliente/waiting-screen";
import { ToppingSelector } from "@/components/pos/cliente/topping-selector";
import { MarqueeDots } from "@/components/pos/cliente/marquee-dots";
import type { PosEvent, OrderItem, ModifierGroup } from "@/types/pos";

type ClientView = "waiting" | "toppings" | "thanks";

export default function ClientePage() {
  const [view, setView] = useState<ClientView>("waiting");
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [orderTotal, setOrderTotal] = useState(0);
  const [toppingState, setToppingState] = useState<{
    productName: string;
    groups: ModifierGroup[];
    selected: Record<string, number>;
  } | null>(null);

  const { send } = usePosChannel(
    useCallback((event: PosEvent) => {
      switch (event.type) {
        case "show_toppings":
          setToppingState({
            productName: event.product_name,
            groups: event.modifiers,
            selected: event.selected,
          });
          setView("toppings");
          break;

        case "topping_toggled":
          setToppingState((prev) => {
            if (!prev) return prev;
            const selected = { ...prev.selected };
            if (event.active) {
              selected[event.modifier_fudo_id] = 1;
            } else {
              delete selected[event.modifier_fudo_id];
            }
            return { ...prev, selected };
          });
          break;

        case "toppings_confirmed":
          setView("waiting");
          setToppingState(null);
          break;

        case "order_updated":
          setOrderItems(event.items);
          setOrderTotal(event.total);
          break;

        case "clear":
          setView("thanks");
          setOrderItems([]);
          setOrderTotal(0);
          setToppingState(null);
          // Return to waiting after showing thanks
          setTimeout(() => setView("waiting"), 3000);
          break;
      }
    }, [])
  );

  const handleToppingToggle = useCallback(
    (modifierFudoId: string, active: boolean) => {
      // Update local state (with group max enforcement)
      setToppingState((prev) => {
        if (!prev) return prev;
        const selected = { ...prev.selected };
        if (active) {
          // Find the group and check max
          const group = prev.groups.find((g) =>
            g.options.some((o) => o.fudo_modifier_id === modifierFudoId)
          );
          if (group) {
            const currentCount = group.options.filter(
              (o) => selected[o.fudo_modifier_id]
            ).length;
            if (currentCount >= group.max_quantity) return prev; // at limit
          }
          selected[modifierFudoId] = 1;
        } else {
          delete selected[modifierFudoId];
        }
        return { ...prev, selected };
      });

      // Find modifier_group_fudo_id for this modifier
      const group = toppingState?.groups.find((g) =>
        g.options.some((o) => o.fudo_modifier_id === modifierFudoId)
      );

      // Broadcast to caja
      send({
        type: "topping_toggled",
        modifier_fudo_id: modifierFudoId,
        modifier_group_fudo_id: group?.fudo_id || "",
        active,
      });
    },
    [send, toppingState?.groups]
  );

  // Thanks view — Diner Marquee style
  if (view === "thanks") {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-white text-center">
        <MarqueeDots count={9} className="mb-4" />
        <h1 className="font-[family-name:var(--font-playfair)] text-[78px] font-black text-[var(--pos-dark)]">
          &iexcl;Gracias!
        </h1>
        <div className="mx-auto mt-1.5 h-[3px] w-12 rounded-sm bg-[var(--pos-red)]" />
        <p className="mt-3 text-lg text-[var(--pos-muted)]">
          Disfruta tu comida
        </p>
        <p className="mt-10 font-[family-name:var(--font-dm-mono)] text-[9px] uppercase tracking-[6px] text-[rgba(26,17,23,.12)]">
          Fanzine &middot; Cine & Tex-Mex
        </p>
      </div>
    );
  }

  if (view === "toppings" && toppingState) {
    return (
      <ToppingSelector
        productName={toppingState.productName}
        groups={toppingState.groups}
        selected={toppingState.selected}
        onToggle={handleToppingToggle}
      />
    );
  }

  return <WaitingScreen items={orderItems} total={orderTotal} />;
}
