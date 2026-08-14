"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

// Persistent queue of POS operations captured while offline. Each op is
// replayed against its API route when the connection comes back.

export type QueuedOpKind = "sale" | "close";

export interface QueuedOp {
  local_id: string;
  kind: QueuedOpKind;
  payload: Record<string, unknown>;
  label: string; // short description for the sync banner
  total: number;
  created_at: string;
  status: "pending" | "error";
  error?: string;
}

const ENDPOINTS: Record<QueuedOpKind, string> = {
  sale: "/api/pos/sale",
  close: "/api/pos/sale/close",
};

interface OfflineQueueState {
  ops: QueuedOp[];
  isFlushing: boolean;
  enqueue: (op: Pick<QueuedOp, "kind" | "payload" | "label" | "total">) => void;
  remove: (localId: string) => void;
  retry: (localId: string) => void;
  flush: () => Promise<void>;
}

export const useOfflineQueue = create<OfflineQueueState>()(
  persist(
    (set, get) => ({
      ops: [],
      isFlushing: false,

      enqueue: (op) => {
        set((s) => ({
          ops: [
            ...s.ops,
            {
              ...op,
              local_id: crypto.randomUUID(),
              created_at: new Date().toISOString(),
              status: "pending" as const,
            },
          ],
        }));
      },

      remove: (localId) => {
        set((s) => ({ ops: s.ops.filter((o) => o.local_id !== localId) }));
      },

      retry: (localId) => {
        set((s) => ({
          ops: s.ops.map((o) =>
            o.local_id === localId
              ? { ...o, status: "pending" as const, error: undefined }
              : o
          ),
        }));
      },

      flush: async () => {
        const { isFlushing } = get();
        if (isFlushing) return;
        if (typeof navigator !== "undefined" && !navigator.onLine) return;
        if (get().ops.every((o) => o.status !== "pending")) return;

        set({ isFlushing: true });
        try {
          // Replay in order; stop on network failure (still offline)
          for (const op of [...get().ops]) {
            if (op.status !== "pending") continue;
            try {
              const res = await fetch(ENDPOINTS[op.kind], {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(op.payload),
              });
              if (res.ok) {
                get().remove(op.local_id);
              } else {
                // Server rejected it — keep with error so the cashier decides
                const err = await res.json().catch(() => ({}));
                set((s) => ({
                  ops: s.ops.map((o) =>
                    o.local_id === op.local_id
                      ? {
                          ...o,
                          status: "error" as const,
                          error: err.error || `Error ${res.status}`,
                        }
                      : o
                  ),
                }));
              }
            } catch {
              // Network error — abort, we'll retry on the next flush
              break;
            }
          }
        } finally {
          set({ isFlushing: false });
        }
      },
    }),
    {
      name: "fanzine-pos-offline-queue",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ ops: s.ops }),
    }
  )
);
