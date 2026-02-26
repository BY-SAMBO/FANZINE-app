"use client";

import { useState, useCallback, useRef } from "react";

/**
 * WebUSB hook for thermal POS printers.
 *
 * Flow:
 * 1. User clicks "connect" → browser shows USB device picker
 * 2. Once paired, the device is remembered for subsequent prints
 * 3. `printRaw(data)` sends ESC/POS bytes directly to the printer
 */

// WebUSB types are not in the default TS DOM lib.
// We access navigator.usb dynamically to avoid type errors.

function getUSB(): { requestDevice: (options: unknown) => Promise<unknown> } | null {
  if (typeof navigator === "undefined") return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (navigator as any).usb ?? null;
}

export function useThermalPrinter() {
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const deviceRef = useRef<any>(null);

  const isSupported = !!getUSB();

  /** Request the user to pick a USB printer */
  const connect = useCallback(async () => {
    const usb = getUSB();
    if (!usb) {
      setError("WebUSB no soportado en este navegador");
      return false;
    }

    try {
      setError(null);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const device: any = await usb.requestDevice({
        filters: [{ classCode: 7 }], // USB Printer class
      });

      await device.open();

      // Select configuration (usually the first/only one)
      if (device.configuration === null) {
        await device.selectConfiguration(1);
      }

      // Find the printer interface (class 7) and claim it
      const iface = device.configuration?.interfaces.find(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (i: any) => i.alternate.interfaceClass === 7
      );

      if (!iface) {
        await device.claimInterface(0);
      } else {
        await device.claimInterface(iface.interfaceNumber);
      }

      deviceRef.current = device;
      setConnected(true);
      return true;
    } catch (err) {
      if (err instanceof DOMException && err.name === "NotFoundError") {
        // User cancelled the picker
        return false;
      }
      const msg = err instanceof Error ? err.message : "Error conectando impresora";
      setError(msg);
      console.error("[WebUSB] Connect failed:", err);
      return false;
    }
  }, [isSupported]);

  /** Send raw bytes to the printer */
  const printRaw = useCallback(async (data: Uint8Array): Promise<boolean> => {
    const device = deviceRef.current;
    if (!device) {
      setError("Impresora no conectada");
      return false;
    }

    try {
      setError(null);

      // Find bulk OUT endpoint
      let endpointNumber = 1; // default
      const iface =
        device.configuration?.interfaces.find(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (i: any) => i.alternate.interfaceClass === 7
        ) ?? device.configuration?.interfaces[0];

      if (iface) {
        const outEndpoint = iface.alternate.endpoints.find(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (ep: any) => ep.direction === "out" && ep.type === "bulk"
        );
        if (outEndpoint) {
          endpointNumber = outEndpoint.endpointNumber;
        }
      }

      // Send data in chunks (some printers have max packet size)
      const CHUNK_SIZE = 64;
      for (let offset = 0; offset < data.length; offset += CHUNK_SIZE) {
        const chunk = data.slice(offset, offset + CHUNK_SIZE);
        await device.transferOut(endpointNumber, chunk);
      }

      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error imprimiendo";
      setError(msg);
      console.error("[WebUSB] Print failed:", err);

      // Device may have disconnected
      setConnected(false);
      deviceRef.current = null;
      return false;
    }
  }, []);

  /** Disconnect the printer */
  const disconnect = useCallback(async () => {
    try {
      await deviceRef.current?.close();
    } catch {
      // ignore
    }
    deviceRef.current = null;
    setConnected(false);
  }, []);

  return {
    isSupported,
    connected,
    error,
    connect,
    disconnect,
    printRaw,
  };
}
