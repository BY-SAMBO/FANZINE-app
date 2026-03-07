/**
 * Print queue — IndexedDB persistence for failed print jobs.
 * When printRaw() fails (printer disconnected), ticket bytes are
 * saved and auto-retried when the printer reconnects.
 */

const DB_NAME = "pos-v2-print";
const DB_VERSION = 1;
const STORE_NAME = "pending-prints";

interface PendingPrint {
  id: string;
  bytes: Uint8Array;
  label: string; // e.g. "Comanda #1234"
  createdAt: number;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function enqueuePrint(bytes: Uint8Array, label: string): Promise<string> {
  const db = await openDB();
  const id = crypto.randomUUID();
  const entry: PendingPrint = { id, bytes, label, createdAt: Date.now() };
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(entry);
    tx.oncomplete = () => resolve(id);
    tx.onerror = () => reject(tx.error);
  });
}

export async function dequeuePrint(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getPendingPrints(): Promise<PendingPrint[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const req = tx.objectStore(STORE_NAME).getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function getPendingPrintCount(): Promise<number> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const req = tx.objectStore(STORE_NAME).count();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Flush all pending prints. Calls `printFn` for each entry.
 * Removes successfully printed entries, keeps failed ones.
 * Returns count of successfully printed jobs.
 */
export async function flushPendingPrints(
  printFn: (bytes: Uint8Array) => Promise<void>
): Promise<number> {
  const pending = await getPendingPrints();
  let flushed = 0;

  for (const entry of pending) {
    try {
      await printFn(entry.bytes);
      await dequeuePrint(entry.id);
      flushed++;
    } catch {
      // Printer still unavailable, keep in queue
      break; // Stop trying if printer fails
    }
  }

  return flushed;
}
