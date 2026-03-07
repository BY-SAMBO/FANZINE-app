"use client";

import { useState, useEffect, useCallback } from "react";
import { Printer, RotateCw } from "lucide-react";
import { usePrinterStore } from "@/lib/stores/printer-store";
import { getPendingPrintCount, flushPendingPrints } from "@/lib/pos-v2/print-queue";

export function PrinterBanner() {
  const connected = usePrinterStore((s) => s.connected);
  const isSupported = usePrinterStore((s) => s.isSupported);
  const connect = usePrinterStore((s) => s.connect);
  const printRaw = usePrinterStore((s) => s.printRaw);
  const [pendingCount, setPendingCount] = useState(0);
  const [flushing, setFlushing] = useState(false);

  // Poll pending print count
  useEffect(() => {
    let mounted = true;
    const check = async () => {
      try {
        const count = await getPendingPrintCount();
        if (mounted) setPendingCount(count);
      } catch {
        // IndexedDB not available
      }
    };
    check();
    const interval = setInterval(check, 5_000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  // Auto-flush when printer reconnects
  useEffect(() => {
    if (!connected || pendingCount === 0) return;
    let cancelled = false;

    const flush = async () => {
      setFlushing(true);
      try {
        const flushed = await flushPendingPrints(async (bytes) => { await printRaw(bytes as Uint8Array); });
        if (!cancelled) {
          setPendingCount((c) => Math.max(0, c - flushed));
        }
      } finally {
        if (!cancelled) setFlushing(false);
      }
    };

    flush();
    return () => { cancelled = true; };
  }, [connected, pendingCount, printRaw]);

  const handleFlush = useCallback(async () => {
    setFlushing(true);
    try {
      const flushed = await flushPendingPrints(async (bytes) => { await printRaw(bytes as Uint8Array); });
      setPendingCount((c) => Math.max(0, c - flushed));
    } finally {
      setFlushing(false);
    }
  }, [printRaw]);

  if (!isSupported) return null;

  // Connected with no pending — nothing to show
  if (connected && pendingCount === 0) return null;

  // Connected but has pending prints
  if (connected && pendingCount > 0) {
    return (
      <button
        onClick={handleFlush}
        disabled={flushing}
        className="w-full flex items-center justify-center gap-2 py-2 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-xs font-bold uppercase tracking-wider hover:bg-amber-100 disabled:opacity-50 transition-colors"
      >
        <RotateCw className={`w-3.5 h-3.5 ${flushing ? "animate-spin" : ""}`} />
        {flushing ? "Imprimiendo..." : `Reimprimir ${pendingCount} pendiente${pendingCount > 1 ? "s" : ""}`}
      </button>
    );
  }

  // Not connected
  return (
    <button
      onClick={connect}
      className="w-full flex items-center justify-center gap-2 py-2 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-xs font-bold uppercase tracking-wider hover:bg-yellow-100 transition-colors"
    >
      <Printer className="w-3.5 h-3.5" />
      Conectar impresora
      {pendingCount > 0 && (
        <span className="ml-1 px-1.5 py-0.5 bg-yellow-200 rounded-full text-[10px]">
          {pendingCount}
        </span>
      )}
    </button>
  );
}
