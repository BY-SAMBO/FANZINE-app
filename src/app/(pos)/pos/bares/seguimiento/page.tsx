"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRemoteOrdersRealtime } from "@/lib/hooks/use-remote-orders-realtime";
import { useRemoteOrderHistory, type RemoteOrderLog } from "@/lib/hooks/use-remote-pos";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import {
  Truck,
  Clock,
  Check,
  X,
  ChefHat,
  Package,
  Wifi,
  WifiOff,
  Volume2,
  VolumeX,
  RefreshCw,
} from "lucide-react";

const STATUS_CONFIG: Record<
  string,
  { label: string; icon: typeof Clock; color: string; bg: string; ring: string }
> = {
  sent: {
    label: "Enviado",
    icon: Clock,
    color: "text-blue-600",
    bg: "bg-blue-50 border-blue-200",
    ring: "ring-blue-400",
  },
  confirmed: {
    label: "Confirmado",
    icon: Check,
    color: "text-emerald-600",
    bg: "bg-emerald-50 border-emerald-200",
    ring: "ring-emerald-400",
  },
  rejected: {
    label: "Rechazado",
    icon: X,
    color: "text-red-600",
    bg: "bg-red-50 border-red-200",
    ring: "ring-red-400",
  },
  ready: {
    label: "Listo para entregar",
    icon: ChefHat,
    color: "text-amber-600",
    bg: "bg-amber-50 border-amber-200",
    ring: "ring-amber-400",
  },
  closed: {
    label: "Cerrado",
    icon: Package,
    color: "text-gray-500",
    bg: "bg-gray-50 border-gray-200",
    ring: "ring-gray-400",
  },
  error: {
    label: "Error",
    icon: X,
    color: "text-red-600",
    bg: "bg-red-50 border-red-200",
    ring: "ring-red-400",
  },
};

// Sound frequencies for notification
function playNotificationSound() {
  try {
    const ctx = new AudioContext();

    // Two-tone chime
    const playTone = (freq: number, start: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.3, ctx.currentTime + start);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + start + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + duration);
    };

    playTone(880, 0, 0.15);
    playTone(1320, 0.12, 0.2);
    playTone(1760, 0.28, 0.3);

    setTimeout(() => ctx.close(), 1000);
  } catch {
    // AudioContext not available
  }
}

export default function SeguimientoPage() {
  const { data: orders, refetch } = useRemoteOrderHistory();
  const queryClient = useQueryClient();
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [flashId, setFlashId] = useState<string | null>(null);
  const flashTimer = useRef<ReturnType<typeof setTimeout>>(null);
  const isInitialLoad = useRef(true);

  // Mark initial load complete after first data
  useEffect(() => {
    if (orders && isInitialLoad.current) {
      isInitialLoad.current = false;
    }
  }, [orders]);

  const handleUpdate = useCallback(
    (event: { id: string; status: string; location_name: string; customer_name: string | null }) => {
      // Don't sound on initial subscription replay
      if (isInitialLoad.current) return;

      // Play sound
      if (soundEnabled) {
        playNotificationSound();
      }

      // Flash the card
      setFlashId(event.id);
      if (flashTimer.current) clearTimeout(flashTimer.current);
      flashTimer.current = setTimeout(() => setFlashId(null), 3000);

      // Refetch to get updated data
      queryClient.invalidateQueries({ queryKey: ["remote-order-history"] });
    },
    [soundEnabled, queryClient]
  );

  const { connected } = useRemoteOrdersRealtime(handleUpdate);

  // Auto-refetch every 30s as fallback
  useEffect(() => {
    const interval = setInterval(() => refetch(), 30_000);
    return () => clearInterval(interval);
  }, [refetch]);

  // Separate orders by active vs completed
  const activeOrders =
    orders?.filter((o) => ["sent", "confirmed", "ready"].includes(o.status)) ?? [];
  const completedOrders =
    orders?.filter((o) => ["closed", "rejected", "error"].includes(o.status)) ?? [];

  return (
    <div className="flex flex-col h-full bg-[#0f1117] text-white">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <Truck className="w-6 h-6 text-emerald-400" />
          <div>
            <h1 className="text-lg font-extrabold tracking-tight">Seguimiento Pedidos</h1>
            <p className="text-xs text-white/40">Delivery Bares — Actualización en tiempo real</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Connection status */}
          <div
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold",
              connected ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"
            )}
          >
            {connected ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
            {connected ? "Conectado" : "Desconectado"}
          </div>

          {/* Sound toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={cn(
              "p-2 rounded-lg transition-all",
              soundEnabled
                ? "bg-white/10 text-white hover:bg-white/20"
                : "bg-white/5 text-white/30 hover:bg-white/10"
            )}
            title={soundEnabled ? "Silenciar" : "Activar sonido"}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Manual refresh */}
          <button
            onClick={() => refetch()}
            className="p-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-all"
            title="Refrescar"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* Test sound */}
          <button
            onClick={playNotificationSound}
            className="px-3 py-1.5 rounded-lg bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/80 transition-all text-xs font-bold"
          >
            Test
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Active orders */}
        {activeOrders.length === 0 && completedOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-white/20">
            <Truck className="w-16 h-16 mb-4" />
            <p className="text-lg font-bold">Sin pedidos</p>
            <p className="text-sm">Los pedidos apareceran aqui en tiempo real</p>
          </div>
        ) : (
          <>
            {activeOrders.length > 0 && (
              <section>
                <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-white/40 mb-3">
                  Activos ({activeOrders.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                  {activeOrders.map((order) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      isFlashing={flashId === order.id}
                    />
                  ))}
                </div>
              </section>
            )}

            {completedOrders.length > 0 && (
              <section>
                <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-white/20 mb-3">
                  Completados ({completedOrders.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                  {completedOrders.map((order) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      isFlashing={flashId === order.id}
                    />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function OrderCard({
  order,
  isFlashing,
}: {
  order: RemoteOrderLog;
  isFlashing: boolean;
}) {
  const config = STATUS_CONFIG[order.status] || STATUS_CONFIG.sent;
  const Icon = config.icon;
  const time = new Date(order.created_at).toLocaleTimeString("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div
      className={cn(
        "rounded-xl border p-4 transition-all duration-300",
        "bg-white/5 border-white/10",
        isFlashing && "animate-pulse ring-2 ring-offset-2 ring-offset-[#0f1117]",
        isFlashing && config.ring
      )}
    >
      {/* Top row: status + time */}
      <div className="flex items-center justify-between mb-3">
        <div
          className={cn(
            "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-extrabold border",
            config.bg,
            config.color
          )}
        >
          <Icon className="w-3.5 h-3.5" />
          {config.label}
        </div>
        <span className="text-xs text-white/30 tabular-nums font-mono">{time}</span>
      </div>

      {/* Order info */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-sm font-extrabold text-white">
            {order.customer_name || "Sin nombre"}
          </span>
          <span className="text-lg font-extrabold text-white tabular-nums">
            ${Number(order.total + order.delivery_fee).toLocaleString()}
          </span>
        </div>

        <div className="flex items-center justify-between text-xs text-white/40">
          <span className="font-semibold">{order.location_name}</span>
          {order.fudo_order_id && (
            <span className="font-mono">#{order.fudo_order_id}</span>
          )}
        </div>

        {Number(order.delivery_fee) > 0 && (
          <div className="text-[10px] text-white/25">
            Delivery: ${Number(order.delivery_fee).toLocaleString()}
          </div>
        )}
      </div>
    </div>
  );
}
