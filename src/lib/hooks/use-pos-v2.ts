"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getPosProducts,
  getProductModifiers,
} from "@/lib/services/pos-service";
import type { OrderItem, SaleType, SaleMode, PaymentMethod, RemoteOrderLog } from "@/types/pos-v2";

export function usePosProducts() {
  return useQuery({
    queryKey: ["pos-products"],
    queryFn: getPosProducts,
    staleTime: 5 * 60 * 1000,
  });
}

export function useProductModifiers(productFudoId: string | null) {
  return useQuery({
    queryKey: ["pos-modifiers", productFudoId],
    queryFn: () => getProductModifiers(productFudoId!),
    enabled: !!productFudoId,
    staleTime: 5 * 60 * 1000,
  });
}

interface SubmitOrderPayload {
  items: OrderItem[];
  sale_type: SaleType;
  sale_mode?: SaleMode;
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
      const res = await fetch("/api/pos/modifiers/sync", { method: "POST" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Error desconocido" }));
        throw new Error(err.error || `Error ${res.status}`);
      }
      return res.json();
    },
  });
}

export function useOrderHistory() {
  return useQuery({
    queryKey: ["pos-order-history"],
    queryFn: async () => {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { data, error } = await supabase
        .from("pos_sales_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
    staleTime: 30_000,
  });
}

export function useCloseSale() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      fudo_sale_id: string;
      payment_method: string;
      total: number;
    }) => {
      const res = await fetch("/api/pos/sale/close", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Error desconocido" }));
        const fudoDetail = err.fudo_response
          ? ` | Fudo: ${typeof err.fudo_response === "string" ? err.fudo_response : JSON.stringify(err.fudo_response)}`
          : "";
        throw new Error((err.error || `Error ${res.status}`) + fudoDetail);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pos-order-history"] });
    },
  });
}

// Remote / Delivery hooks
export interface RemoteLocation {
  id: string;
  name: string;
  address: string;
  delivery_fee: number;
  is_active: boolean;
  notes: string | null;
}

export function useRemoteLocations() {
  return useQuery({
    queryKey: ["remote-locations"],
    queryFn: async () => {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { data, error } = await supabase
        .from("remote_pos_locations")
        .select("id, name, address, delivery_fee, is_active, notes")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data as RemoteLocation[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

interface RemoteOrderPayload {
  location_id: string;
  items: OrderItem[];
  customer_name: string;
  customer_phone: string;
  comment?: string;
  total: number;
}

export function useSubmitRemoteOrder() {
  return useMutation({
    mutationFn: async (payload: RemoteOrderPayload) => {
      const res = await fetch("/api/pos/remote/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Error ${res.status}`);
      }
      return res.json() as Promise<{
        success: boolean;
        fudo_order_id: number;
        external_id: string;
      }>;
    },
  });
}

export function useRemoteOrderHistory() {
  return useQuery({
    queryKey: ["remote-order-history"],
    queryFn: async () => {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { data, error } = await supabase
        .from("remote_pos_orders_log")
        .select(
          "id, location_name, fudo_order_id, external_id, total, delivery_fee, customer_name, status, created_at"
        )
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as RemoteOrderLog[];
    },
    staleTime: 30_000,
  });
}
