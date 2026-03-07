/**
 * Offline sale queue — IndexedDB persistence for failed sales.
 * When POST /api/pos/sale fails due to network, the payload is queued
 * and auto-retried when connectivity returns.
 */

const DB_NAME = "pos-v2-offline";
const DB_VERSION = 1;
const STORE_NAME = "pending-sales";

interface PendingSale {
  id: string;
  payload: unknown;
  createdAt: number;
  retries: number;
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

export async function enqueueSale(payload: unknown): Promise<string> {
  const db = await openDB();
  const id = crypto.randomUUID();
  const entry: PendingSale = { id, payload, createdAt: Date.now(), retries: 0 };
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(entry);
    tx.oncomplete = () => resolve(id);
    tx.onerror = () => reject(tx.error);
  });
}

export async function dequeueSale(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getPendingSales(): Promise<PendingSale[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const req = tx.objectStore(STORE_NAME).getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function getPendingCount(): Promise<number> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const req = tx.objectStore(STORE_NAME).count();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function incrementRetry(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const getReq = store.get(id);
    getReq.onsuccess = () => {
      const entry = getReq.result as PendingSale | undefined;
      if (entry) {
        entry.retries += 1;
        store.put(entry);
      }
    };
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Flush all pending sales. Calls `submitFn` for each entry.
 * Removes successfully submitted entries, keeps failed ones.
 * Returns count of successfully flushed sales.
 */
export async function flushPendingSales(
  submitFn: (payload: unknown) => Promise<void>
): Promise<number> {
  const pending = await getPendingSales();
  let flushed = 0;

  for (const entry of pending) {
    try {
      await submitFn(entry.payload);
      await dequeueSale(entry.id);
      flushed++;
    } catch {
      await incrementRetry(entry.id);
    }
  }

  return flushed;
}

/**
 * Sets up an online listener that auto-flushes the queue.
 * Returns a cleanup function to remove the listener.
 */
export function setupAutoFlush(
  submitFn: (payload: unknown) => Promise<void>,
  onFlush?: (count: number) => void
): () => void {
  const handler = async () => {
    const count = await flushPendingSales(submitFn);
    if (count > 0) onFlush?.(count);
  };

  window.addEventListener("online", handler);
  return () => window.removeEventListener("online", handler);
}
