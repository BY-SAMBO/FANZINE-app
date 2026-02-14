"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";
import type { RemoteOrderLog } from "./use-remote-pos";

interface OrderUpdateEvent {
  id: string;
  status: string;
  fudo_order_id: number | null;
  location_name: string;
  customer_name: string | null;
}

/**
 * Subscribes to Supabase Realtime postgres_changes on remote_pos_orders_log.
 * Fires onUpdate callback when an order status changes (via webhook or insert).
 */
export function useRemoteOrdersRealtime(
  onUpdate: (event: OrderUpdateEvent) => void
) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase.channel("remote-orders-updates");

    channel
      // Listen for UPDATEs (status changes from webhook)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "remote_pos_orders_log",
        },
        (payload) => {
          const row = payload.new as RemoteOrderLog;
          onUpdateRef.current({
            id: row.id,
            status: row.status,
            fudo_order_id: row.fudo_order_id,
            location_name: row.location_name,
            customer_name: row.customer_name,
          });
        }
      )
      // Listen for INSERTs (new orders created)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "remote_pos_orders_log",
        },
        (payload) => {
          const row = payload.new as RemoteOrderLog;
          onUpdateRef.current({
            id: row.id,
            status: row.status,
            fudo_order_id: row.fudo_order_id,
            location_name: row.location_name,
            customer_name: row.customer_name,
          });
        }
      )
      .subscribe((status) => {
        setConnected(status === "SUBSCRIBED");
      });

    channelRef.current = channel;

    return () => {
      setConnected(false);
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, []);

  return { connected };
}
