"use client";

import { useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { usePosLiveChannel } from "@/lib/hooks/use-pos-live-channel";
import { WaitingScreen } from "@/components/pos-live/cliente/waiting-screen";
import { ToppingSelector } from "@/components/pos-live/cliente/topping-selector";
import { MarqueeDots } from "@/components/pos-live/cliente/marquee-dots";
import type { PosEvent, OrderItem, ModifierGroup } from "@/types/pos";

type ClientView = "connect" | "waiting" | "toppings" | "thanks";

function ClienteContent() {
  const searchParams = useSearchParams();
  const sidFromUrl = searchParams.get("sid");

  const [manualCode, setManualCode] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(sidFromUrl);
  const [view, setView] = useState<ClientView>(sidFromUrl ? "waiting" : "connect");
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [orderTotal, setOrderTotal] = useState(0);
  const [toppingState, setToppingState] = useState<{
    productName: string;
    groups: ModifierGroup[];
    selected: Record<string, number>;
  } | null>(null);

  const { send, connected } = usePosLiveChannel(
    sessionId,
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
          setTimeout(() => setView("waiting"), 3000);
          break;
      }
    }, [])
  );

  const handleToppingToggle = useCallback(
    (modifierFudoId: string, active: boolean) => {
      setToppingState((prev) => {
        if (!prev) return prev;
        const selected = { ...prev.selected };
        if (active) {
          const group = prev.groups.find((g) =>
            g.options.some((o) => o.fudo_modifier_id === modifierFudoId)
          );
          if (group) {
            const currentCount = group.options.filter(
              (o) => selected[o.fudo_modifier_id]
            ).length;
            if (currentCount >= group.max_quantity) return prev;
          }
          selected[modifierFudoId] = 1;
        } else {
          delete selected[modifierFudoId];
        }
        return { ...prev, selected };
      });

      const group = toppingState?.groups.find((g) =>
        g.options.some((o) => o.fudo_modifier_id === modifierFudoId)
      );

      send({
        type: "topping_toggled",
        modifier_fudo_id: modifierFudoId,
        modifier_group_fudo_id: group?.fudo_id || "",
        active,
      });
    },
    [send, toppingState?.groups]
  );

  const handleConnect = () => {
    const code = manualCode.trim().toUpperCase();
    if (code.length >= 4) {
      setSessionId(code);
      setView("waiting");
    }
  };

  // Connect screen - enter session code
  if (view === "connect") {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-white gap-8">
        <div className="text-center">
          <MarqueeDots count={9} className="mb-4" />
          <h1 className="font-[family-name:var(--font-playfair)] text-5xl font-black text-[var(--pos-dark)]">
            FANZINE
          </h1>
          <p className="mt-1 text-sm uppercase tracking-[6px] text-[var(--pos-muted)]">
            Pantalla Cliente
          </p>
        </div>

        <div className="w-full max-w-xs space-y-4">
          <p className="text-center text-sm text-gray-500">
            Ingresa el codigo de la caja
          </p>
          <input
            type="text"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value.toUpperCase().slice(0, 4))}
            placeholder="XXXX"
            maxLength={4}
            className="w-full text-center text-4xl font-[family-name:var(--font-jetbrains-mono)] font-bold tracking-[0.3em] border-2 border-gray-200 rounded-xl py-4 focus:outline-none focus:border-red-600 text-gray-900 placeholder:text-gray-200"
            onKeyDown={(e) => e.key === "Enter" && handleConnect()}
          />
          <button
            onClick={handleConnect}
            disabled={manualCode.length < 4}
            className="w-full py-3 bg-red-600 text-white text-sm font-bold uppercase tracking-wider rounded-lg hover:bg-red-700 disabled:opacity-30 transition-all"
          >
            Conectar
          </button>
        </div>
      </div>
    );
  }

  // Thanks view
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

export default function ClienteLivePage() {
  return (
    <Suspense fallback={
      <div className="flex h-full items-center justify-center bg-white text-gray-400">
        Cargando...
      </div>
    }>
      <ClienteContent />
    </Suspense>
  );
}
