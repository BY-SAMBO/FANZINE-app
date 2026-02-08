"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { SyncComparisonResult, PriceReport } from "@/types/sync";

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}`);
  return res.json();
}

export function useSyncComparison() {
  return useQuery({
    queryKey: ["sync-compare"],
    queryFn: () => fetchJson<SyncComparisonResult>("/api/sync/compare"),
    staleTime: 30_000,
  });
}

export function useSyncPending() {
  return useQuery({
    queryKey: ["sync-pending"],
    queryFn: () => fetchJson<{ products: unknown[] }>("/api/sync/pending"),
  });
}

export function usePriceReport() {
  return useQuery({
    queryKey: ["sync-prices"],
    queryFn: () => fetchJson<{ report: PriceReport[] }>("/api/sync/prices"),
  });
}

export function usePushToFudo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productId: string) => {
      const res = await fetch("/api/sync/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      if (!res.ok) throw new Error("Push failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sync-compare"] });
      queryClient.invalidateQueries({ queryKey: ["sync-pending"] });
      queryClient.invalidateQueries({ queryKey: ["sync-prices"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}
