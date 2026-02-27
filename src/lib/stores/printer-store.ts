"use client";

import { create } from "zustand";

/**
 * Global thermal printer store.
 *
 * Keeps the WebUSB device reference across the entire POS session so that
 * every component (PaymentDialog, SaleDetailDialog, etc.) shares the same
 * connection instead of creating their own local state.
 *
 * Auto-reconnect: call `autoReconnect()` once on POS page mount — it uses
 * `navigator.usb.getDevices()` to silently re-open a previously-paired device
 * without showing the picker again.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getUSB(): any | null {
  if (typeof navigator === "undefined") return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (navigator as any).usb ?? null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function openDevice(device: any): Promise<boolean> {
  await device.open();
  if (device.configuration === null) {
    await device.selectConfiguration(1);
  }
  const iface = device.configuration?.interfaces.find(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (i: any) => i.alternate.interfaceClass === 7
  );
  if (!iface) {
    await device.claimInterface(0);
  } else {
    await device.claimInterface(iface.interfaceNumber);
  }
  return true;
}

interface PrinterState {
  connected: boolean;
  error: string | null;
  isSupported: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _device: any | null;

  /** Show the browser USB picker and connect */
  connect: () => Promise<boolean>;
  /** Silently re-connect to a previously-paired device */
  autoReconnect: () => Promise<boolean>;
  /** Send raw ESC/POS bytes */
  printRaw: (data: Uint8Array) => Promise<boolean>;
  /** Disconnect */
  disconnect: () => Promise<void>;
}

export const usePrinterStore = create<PrinterState>((set, get) => ({
  connected: false,
  error: null,
  isSupported: !!getUSB(),
  _device: null,

  connect: async () => {
    const usb = getUSB();
    if (!usb) {
      set({ error: "WebUSB no soportado en este navegador" });
      return false;
    }
    try {
      set({ error: null });
      const device = await usb.requestDevice({
        filters: [{ classCode: 7 }],
      });
      await openDevice(device);
      set({ _device: device, connected: true });
      return true;
    } catch (err) {
      if (err instanceof DOMException && err.name === "NotFoundError") {
        return false; // user cancelled picker
      }
      const msg = err instanceof Error ? err.message : "Error conectando impresora";
      set({ error: msg });
      console.error("[PrinterStore] Connect failed:", err);
      return false;
    }
  },

  autoReconnect: async () => {
    const usb = getUSB();
    if (!usb || get().connected) return false;

    try {
      const devices = await usb.getDevices();
      // Find a printer-class device that was previously paired
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const printer = devices.find((d: any) => {
        try {
          return d.configuration?.interfaces.some(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (i: any) => i.alternate.interfaceClass === 7
          );
        } catch {
          // If configuration is null (device not opened yet), check device class
          return d.deviceClass === 7;
        }
      }) ?? devices[0]; // fallback: first remembered device

      if (!printer) return false;

      await openDevice(printer);
      set({ _device: printer, connected: true, error: null });
      console.log("[PrinterStore] Auto-reconnected to", printer.productName);
      return true;
    } catch (err) {
      // Silent fail — the user can manually connect later
      console.warn("[PrinterStore] Auto-reconnect failed:", err);
      return false;
    }
  },

  printRaw: async (data: Uint8Array) => {
    const device = get()._device;
    if (!device) {
      set({ error: "Impresora no conectada" });
      return false;
    }

    try {
      set({ error: null });

      // Find bulk OUT endpoint
      let endpointNumber = 1;
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

      const CHUNK_SIZE = 64;
      for (let offset = 0; offset < data.length; offset += CHUNK_SIZE) {
        const chunk = data.slice(offset, offset + CHUNK_SIZE);
        await device.transferOut(endpointNumber, chunk);
      }

      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error imprimiendo";
      set({ error: msg, connected: false, _device: null });
      console.error("[PrinterStore] Print failed:", err);
      return false;
    }
  },

  disconnect: async () => {
    try {
      await get()._device?.close();
    } catch {
      // ignore
    }
    set({ _device: null, connected: false });
  },
}));
