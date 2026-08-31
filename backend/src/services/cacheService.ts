import { getRedisClient, isRedisAvailable } from '../config/redis';
import { cache as memoryCache } from '../utils/cache';

/**
 * Unified Cache Service
 *
 * Redis-first, with automatic fallback to the existing in-memory cache
 * (utils/cache.ts) whenever Redis is not configured or a command fails.
 * Callers never need to know which backend is actually serving a key.
 *
 * TTL STRATEGY (seconds) - chosen per data-volatility, not a single global TTL:
 * - ANALYTICS_SUMMARY (300s / 5min): aggregation-heavy dashboard totals that
 *   tolerate a few minutes of staleness in exchange for not re-scanning the
 *   whole expenses collection on every page load.
 * - ANALYTICS_TRENDS (900s / 15min): monthly/yearly trend charts change
 *   slowly - safe to cache longer.
 * - CATEGORIES (3600s / 1hr): near-static reference data.
 * - BUDGET_STATUS (60s / 1min): needs to reflect newly-added expenses fairly
 *   quickly since users check "am I over budget?" right after adding a cost.
 * - EXPORT_REPORT (900s / 15min): expensive to generate, immutable once a
 *   month/year has fully passed.
 */
export const CacheTTL = {
  ANALYTICS_SUMMARY: 300,
  ANALYTICS_TRENDS: 900,
  CATEGORIES: 3600,
  BUDGET_STATUS: 60,
  EXPORT_REPORT: 900,
} as const;

const NAMESPACE = 'expense-tracker';

function buildKey(namespace: string, ...parts: (string | number)[]): string {
  return `${NAMESPACE}:${namespace}:${parts.join(':')}`;
}

class CacheService {
  async get<T = any>(key: string): Promise<T | null> {
    const redis = getRedisClient();
    if (redis && isRedisAvailable()) {
      try {
        const raw = await redis.get(key);
        return raw ? (JSON.parse(raw) as T) : null;
      } catch (error: any) {
        console.error(`⚠️  Redis GET failed for "${key}", falling back to memory cache:`, error.message);
      }
    }
    const value = memoryCache.get(key);
    return value === undefined ? null : value;
  }

  async set(key: string, value: any, ttlSeconds: number): Promise<void> {
    const redis = getRedisClient();
    if (redis && isRedisAvailable()) {
      try {
        await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
        return;
      } catch (error: any) {
        console.error(`⚠️  Redis SET failed for "${key}", falling back to memory cache:`, error.message);
      }
    }
    memoryCache.set(key, value, ttlSeconds);
  }

  async del(key: string): Promise<void> {
    const redis = getRedisClient();
    if (redis && isRedisAvailable()) {
      try {
        await redis.del(key);
      } catch (error: any) {
        console.error(`⚠️  Redis DEL failed for "${key}":`, error.message);
      }
    }
    memoryCache.delete(key);
  }

  /**
   * Delete every key under a namespace prefix.
   * Uses non-blocking SCAN (never KEYS - KEYS blocks the entire Redis
   * instance and is a well-known production incident cause at scale).
   */
  async deleteByPrefix(prefix: string): Promise<void> {
    const redis = getRedisClient();
    if (redis && isRedisAvailable()) {
      try {
        let cursor = '0';
        do {
          const [nextCursor, keys]: [string, string[]] = await redis.scan(
            cursor,
            'MATCH',
            `${prefix}*`,
            'COUNT',
            100,
          );
          cursor = nextCursor;
          if (keys.length) await redis.del(...keys);
        } while (cursor !== '0');
      } catch (error: any) {
        console.error(`⚠️  Redis SCAN/DEL failed for prefix "${prefix}":`, error.message);
      }
    }
    // In-memory cache keys are literal strings; delete anything starting with prefix.
    memoryCache.deletePattern(`^${prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`);
  }

  /** Read-through cache helper: return cached value or compute, cache, and return it. */
  async wrap<T>(key: string, ttlSeconds: number, loader: () => Promise<T>): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) return cached;
    const fresh = await loader();
    // Don't cache null/undefined results (e.g. transient errors that were swallowed upstream)
    if (fresh !== null && fresh !== undefined) {
      await this.set(key, fresh, ttlSeconds);
    }
    return fresh;
  }

  keys = {
    analyticsSummary: (familyId: string) => buildKey('analytics', 'summary', familyId),
    analyticsTrends: (familyId: string, months: number) => buildKey('analytics', 'trends', familyId, months),
    budgetStatus: (familyId: string) => buildKey('budgets', 'status', familyId),
    categories: (familyId: string) => buildKey('categories', familyId),
  };

  /**
   * CACHE INVALIDATION STRATEGY
   * Rather than trying to patch individual cached fields (error-prone, and
   * the classic source of stale-cache bugs), any mutation that could affect
   * a family's derived data (expense create/update/delete, budget
   * create/update/delete) invalidates that family's whole derived-data
   * namespace. The next read simply recomputes and re-populates the cache.
   * This is deliberately coarse-grained: correctness > cache hit ratio.
   */
  async invalidateFamily(familyId: string): Promise<void> {
    await Promise.all([
      this.deleteByPrefix(buildKey('analytics', 'summary', familyId)),
      this.deleteByPrefix(buildKey('analytics', 'trends', familyId)),
      this.deleteByPrefix(buildKey('budgets', 'status', familyId)),
    ]);
  }
}

export const cacheService = new CacheService();
