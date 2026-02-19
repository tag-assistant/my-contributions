const CACHE_VERSION = 1;
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  version: number;
}

function getCacheKey(prefix: string, ...parts: string[]): string {
  return `mc_${prefix}_${parts.join('_')}`;
}

export function getCached<T>(prefix: string, ...parts: string[]): T | null {
  try {
    const key = getCacheKey(prefix, ...parts);
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const entry: CacheEntry<T> = JSON.parse(raw);
    if (entry.version !== CACHE_VERSION) return null;
    if (Date.now() - entry.timestamp > CACHE_TTL_MS) return null;
    return entry.data;
  } catch {
    return null;
  }
}

export function setCached<T>(data: T, prefix: string, ...parts: string[]): void {
  try {
    const key = getCacheKey(prefix, ...parts);
    const entry: CacheEntry<T> = { data, timestamp: Date.now(), version: CACHE_VERSION };
    localStorage.setItem(key, JSON.stringify(entry));
  } catch {
    // localStorage full — clear old caches
    clearOldCaches();
  }
}

export function getRepoCached(fullName: string): any | null {
  return getCached('repo', fullName);
}

export function setRepoCached(fullName: string, data: any): void {
  setCached(data, 'repo', fullName);
}

function clearOldCaches(): void {
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith('mc_')) keys.push(key);
  }
  // Remove oldest half
  const entries = keys.map(k => {
    try {
      const raw = localStorage.getItem(k);
      const parsed = raw ? JSON.parse(raw) : null;
      return { key: k, ts: parsed?.timestamp || 0 };
    } catch {
      return { key: k, ts: 0 };
    }
  }).sort((a, b) => a.ts - b.ts);

  const toRemove = entries.slice(0, Math.ceil(entries.length / 2));
  toRemove.forEach(e => localStorage.removeItem(e.key));
}
