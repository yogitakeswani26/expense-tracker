// Simple in-memory cache (production: use Redis)
interface CacheEntry {
  value: any;
  expiry: number;
}

class Cache {
  private store: Map<string, CacheEntry> = new Map();

  set(key: string, value: any, ttlSeconds: number = 300) {
    const expiry = Date.now() + ttlSeconds * 1000;
    this.store.set(key, { value, expiry });
  }

  get(key: string) {
    const entry = this.store.get(key);

    if (!entry) {
      return null;
    }

    if (Date.now() > entry.expiry) {
      this.store.delete(key);
      return null;
    }

    return entry.value;
  }

  delete(key: string) {
    this.store.delete(key);
  }

  clear() {
    this.store.clear();
  }

  // Pattern-based deletion (e.g., clear all analytics:* keys)
  deletePattern(pattern: string) {
    const regex = new RegExp(pattern);
    Array.from(this.store.keys()).forEach(key => {
      if (regex.test(key)) {
        this.store.delete(key);
      }
    });
  }

  // Cleanup expired entries
  cleanup() {
    const now = Date.now();
    Array.from(this.store.entries()).forEach(([key, entry]) => {
      if (now > entry.expiry) {
        this.store.delete(key);
      }
    });
  }
}

export const cache = new Cache();

// Start cleanup interval
setInterval(() => {
  cache.cleanup();
}, 60 * 1000); // Every minute
