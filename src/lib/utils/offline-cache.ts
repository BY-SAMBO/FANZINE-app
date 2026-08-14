// Small localStorage cache so the POS keeps working without internet
// (as long as the app is already loaded in the browser).

const CACHE_PREFIX = "fanzine-offline:";

export function readCache<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function writeCache(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(value));
  } catch {
    // Quota exceeded or private mode — cache is best-effort
  }
}

/**
 * Run a fetcher and cache its result. If the fetch fails (e.g. no internet),
 * fall back to the last cached copy instead of throwing.
 */
export async function withOfflineCache<T>(
  key: string,
  fn: () => Promise<T>
): Promise<T> {
  try {
    const data = await fn();
    writeCache(key, data);
    return data;
  } catch (err) {
    const cached = readCache<T>(key);
    if (cached !== null) {
      console.warn(`[Offline] Sin conexión — usando cache local para "${key}"`);
      return cached;
    }
    throw err;
  }
}
