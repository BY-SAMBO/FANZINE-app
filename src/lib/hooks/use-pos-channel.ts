"use client";

import { useEffect, useRef, useCallback } from "react";
import type { PosEvent } from "@/types/pos";

const CHANNEL_NAME = "pos:caja:main";

/**
 * Uses the browser BroadcastChannel API for instant same-browser communication.
 * Both tabs (caja + cliente) share the same origin, so this is faster and
 * more reliable than Supabase Realtime for this use case.
 */
export function usePosChannel(onEvent: (event: PosEvent) => void) {
  const channelRef = useRef<BroadcastChannel | null>(null);
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    const channel = new BroadcastChannel(CHANNEL_NAME);
    channel.onmessage = (e: MessageEvent<PosEvent>) => {
      onEventRef.current(e.data);
    };
    channelRef.current = channel;

    return () => {
      channel.close();
      channelRef.current = null;
    };
  }, []);

  const send = useCallback((event: PosEvent) => {
    channelRef.current?.postMessage(event);
  }, []);

  return { send };
}
