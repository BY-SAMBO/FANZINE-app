"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { PosEvent } from "@/types/pos";
import type { RealtimeChannel } from "@supabase/supabase-js";

/**
 * Uses Supabase Realtime broadcast for cross-device POS communication.
 * Each caja+cliente pair shares a unique channel based on sessionId.
 */
export function usePosLiveChannel(
  sessionId: string | null,
  onEvent: (event: PosEvent) => void
) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!sessionId) return;

    const supabase = createClient();
    const channel = supabase.channel(`pos:live:${sessionId}`, {
      config: { broadcast: { self: false } },
    });

    channel
      .on("broadcast", { event: "pos_event" }, ({ payload }) => {
        onEventRef.current(payload as PosEvent);
      })
      .subscribe((status) => {
        setConnected(status === "SUBSCRIBED");
      });

    channelRef.current = channel;

    return () => {
      setConnected(false);
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [sessionId]);

  const send = useCallback((event: PosEvent) => {
    channelRef.current?.send({
      type: "broadcast",
      event: "pos_event",
      payload: event,
    });
  }, []);

  return { send, connected };
}
