import { useQuery, useMutation } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { OrderItem } from "@/types/pos";

// Re-export shared POS hooks (same product catalog and modifier cache)
export { usePosProducts, useProductModifiers, useSyncModifiers } from "./use-pos";

// --- Remote location types ---

export interface RemoteLocation {
  id: string;
  name: string;
  address: string;
  delivery_fee: number;
  is_active: boolean;
  notes: string | null;
}

// --- Hooks ---

export function useRemoteLocations() {
  return useQuery({
    queryKey: ["remote-locations"],
    queryFn: async () => {
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

export interface RemoteOrderLog {
  id: string;
  location_name: string;
  fudo_order_id: number | null;
  external_id: string;
  total: number;
  delivery_fee: number;
  customer_name: string | null;
  status: string;
  created_at: string;
}

export function useRemoteOrderHistory() {
  return useQuery({
    queryKey: ["remote-order-history"],
    queryFn: async () => {
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
