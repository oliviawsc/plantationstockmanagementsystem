// Safe localStorage / sessionStorage helpers: never throw (private mode,
// quota, corrupt JSON), always fall back.

export function readJson<T>(key: string, fallback: T, store: Storage = localStorage): T {
  try {
    const raw = store.getItem(key);
    if (raw === null) return fallback;
    const v = JSON.parse(raw);
    return v === null || v === undefined ? fallback : (v as T);
  } catch {
    return fallback;
  }
}

/** Reads a JSON array; anything that is not an array becomes []. */
export function readArray<T>(key: string, store: Storage = localStorage): T[] {
  const v = readJson<unknown>(key, [], store);
  return Array.isArray(v) ? (v as T[]) : [];
}

export function writeJson(key: string, value: unknown, store: Storage = localStorage): boolean {
  try {
    store.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function readString(key: string, store: Storage = localStorage): string | null {
  try { return store.getItem(key); } catch { return null; }
}

export function writeString(key: string, value: string, store: Storage = localStorage) {
  try { store.setItem(key, value); } catch { /* ignore */ }
}

export function removeKey(key: string, store: Storage = localStorage) {
  try { store.removeItem(key); } catch { /* ignore */ }
}
