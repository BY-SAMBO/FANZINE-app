"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import {
  getPosProducts,
  getProductModifiers,
} from "@/lib/services/pos-service";
import type { OrderItem, SaleType, PaymentMethod } from "@/types/pos";

export function usePosProducts() {
  return useQuery({
    queryKey: ["pos-products"],
    queryFn: getPosProducts,
    staleTime: 5 * 60 * 1000, // 5 min — product list rarely changes mid-shift
  });
}

export function useProductModifiers(productFudoId: string | null) {
  return useQuery({
    queryKey: ["pos-modifiers", productFudoId],
    queryFn: () => getProductModifiers(productFudoId!),
    enabled: !!productFudoId,
  });
}

interface SubmitOrderPayload {
  items: OrderItem[];
  sale_type: SaleType;
  payment_method: PaymentMethod;
  total: number;
}

export function useSubmitOrder() {
  return useMutation({
    mutationFn: async (payload: SubmitOrderPayload) => {
      const res = await fetch("/api/pos/sale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Error desconocido" }));
        // Surface Fudo error details if available
        const fudoDetail = err.fudo_response
          ? ` | Fudo: ${typeof err.fudo_response === "string" ? err.fudo_response : JSON.stringify(err.fudo_response)}`
          : "";
        throw new Error((err.error || `Error ${res.status}`) + fudoDetail);
      }
      return res.json();
    },
  });
}

export function useSyncModifiers() {
  return useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/pos/modifiers/sync", {
        method: "POST",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Error desconocido" }));
        throw new Error(err.error || `Error ${res.status}`);
      }
      return res.json();
    },
  });
}
