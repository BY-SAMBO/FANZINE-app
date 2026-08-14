"use client";

import { useEffect, useSyncExternalStore } from "react";
import { CloudOff, RefreshCw, Trash2, UploadCloud } from "lucide-react";
import { useOfflineQueue } from "@/lib/pos-v2/offline-queue";
import { useOnlineStatus } from "@/lib/hooks/use-online-status";
import { useQueryClient } from "@tanstack/react-query";

/**
 * Offline status + pending sales sync. Invisible when online with an empty
 * queue. Auto-flushes when the connection returns and every 45s as backup.
 */
const emptySubscribe = () => () => {};

export function OfflineBanner() {
  // Render nothing until hydrated — the queue comes from localStorage and
  // would mismatch the server-rendered HTML
  const hydrated = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
  const online = useOnlineStatus();
  const ops = useOfflineQueue((s) => s.ops);
  const isFlushing = useOfflineQueue((s) => s.isFlushing);
  const flush = useOfflineQueue((s) => s.flush);
  const retry = useOfflineQueue((s) => s.retry);
  const remove = useOfflineQueue((s) => s.remove);
  const queryClient = useQueryClient();

  const pending = ops.filter((o) => o.status === "pending");
  const failed = ops.filter((o) => o.status === "error");

  // Flush when connection returns / on mount / periodically as backup
  useEffect(() => {
    if (!online || ops.length === 0) return;
    const doFlush = () =>
      flush().then(() => {
        queryClient.invalidateQueries({ queryKey: ["pos-order-history"] });
      });
    doFlush();
    const interval = setInterval(doFlush, 45_000);
    return () => clearInterval(interval);
  }, [online, ops.length, flush, queryClient]);

  if (!hydrated) return null;
  if (online && ops.length === 0) return null;

  return (
    <div className="space-y-1">
      {!online && (
        <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-300 rounded-lg">
          <CloudOff className="w-4 h-4 text-amber-600 shrink-0" />
          <p className="text-xs font-semibold text-amber-800">
            Sin internet — el POS sigue funcionando. Las ventas se guardan aquí
            y se sincronizan solas al volver la conexión.
          </p>
          {pending.length > 0 && (
            <span className="ml-auto shrink-0 px-2 py-0.5 text-[10px] font-bold bg-amber-200 text-amber-800 rounded-full tabular-nums">
              {pending.length} en cola
            </span>
          )}
        </div>
      )}

      {online && pending.length > 0 && (
        <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-300 rounded-lg">
          <UploadCloud className="w-4 h-4 text-blue-600 shrink-0" />
          <p className="text-xs font-semibold text-blue-800">
            {pending.length} venta{pending.length === 1 ? "" : "s"} pendiente
            {pending.length === 1 ? "" : "s"} por sincronizar
          </p>
          <button
            onClick={() =>
              flush().then(() =>
                queryClient.invalidateQueries({ queryKey: ["pos-order-history"] })
              )
            }
            disabled={isFlushing}
            className="ml-auto shrink-0 flex items-center gap-1 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-700 border border-blue-300 rounded-md hover:bg-blue-100 disabled:opacity-50 transition-all"
          >
            <RefreshCw className={isFlushing ? "w-3 h-3 animate-spin" : "w-3 h-3"} />
            {isFlushing ? "Sincronizando..." : "Sincronizar"}
          </button>
        </div>
      )}

      {failed.map((op) => (
        <div
          key={op.local_id}
          className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-300 rounded-lg"
        >
          <p className="text-xs font-semibold text-red-700 flex-1 min-w-0 truncate">
            {op.label}: {op.error || "Error al sincronizar"}
          </p>
          <button
            onClick={() => retry(op.local_id)}
            className="shrink-0 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-red-700 border border-red-300 rounded-md hover:bg-red-100 transition-all"
          >
            Reintentar
          </button>
          <button
            onClick={() => remove(op.local_id)}
            title="Descartar"
            className="shrink-0 p-1 text-red-400 hover:text-red-700 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
