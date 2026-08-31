import Redis from 'ioredis';

/**
 * Redis Configuration
 *
 * PROBLEM: The existing in-memory cache (utils/cache.ts) does not scale beyond
 * a single process:
 * - Every server instance/container has its own cache -> cache hit rate drops
 *   as you scale horizontally (each pod is cold and re-computes everything)
 * - Cache is wiped on every deploy/restart
 * - No way to invalidate a key across all running instances at once
 *
 * SOLUTION: Redis as a shared, persistent cache layer used by cacheService.ts
 *
 * GRACEFUL DEGRADATION: If REDIS_URL is not set, or Redis is unreachable, the
 * app automatically falls back to the in-memory cache (see cacheService.ts).
 * Local development and single-instance deployments keep working with zero
 * configuration - Redis is an opt-in performance upgrade, never a hard
 * dependency for the server to boot.
 */

const REDIS_URL = process.env.REDIS_URL || process.env.REDIS_TLS_URL || '';

let redisClient: Redis | null = null;
let redisReady = false;
let hasLoggedDisabled = false;

export const getRedisClient = (): Redis | null => {
  if (!REDIS_URL) {
    if (!hasLoggedDisabled) {
      console.log('ℹ️  REDIS_URL not set - using in-memory cache (single-instance mode)');
      hasLoggedDisabled = true;
    }
    return null;
  }

  if (redisClient) {
    return redisClient;
  }

  redisClient = new Redis(REDIS_URL, {
    // --- Connection pool / resiliency tuning for production ---
    maxRetriesPerRequest: 2, // fail a single command fast instead of queuing forever
    connectTimeout: 5000,
    enableOfflineQueue: false, // don't buffer commands while disconnected - fall back to memory cache instead
    lazyConnect: true, // connect() is called explicitly below so boot never blocks on Redis
    keepAlive: 10000,
    retryStrategy: (times: number) => {
      // Exponential backoff capped at 10s. Keep retrying in the background
      // forever in prod (transient network blips / Redis failover) but stop
      // hammering a genuinely dead endpoint in dev.
      if (process.env.NODE_ENV !== 'production' && times > 10) {
        return null;
      }
      return Math.min(times * 200, 10000);
    },
    // Managed Redis providers (Upstash, Redis Cloud, ElastiCache w/ TLS) use rediss://
    tls: REDIS_URL.startsWith('rediss://') ? {} : undefined,
  });

  redisClient.on('ready', () => {
    redisReady = true;
    console.log('✅ Redis: connected and ready');
  });

  redisClient.on('error', (err: Error) => {
    if (redisReady) {
      console.error('❌ Redis error (falling back to in-memory cache):', err.message);
    }
    redisReady = false;
  });

  redisClient.on('close', () => {
    redisReady = false;
  });

  redisClient.connect().catch((err: Error) => {
    console.error('❌ Redis: initial connection failed, using in-memory cache fallback:', err.message);
  });

  return redisClient;
};

/** True only when a real Redis connection is currently established and healthy. */
export const isRedisAvailable = (): boolean => redisReady;

export const disconnectRedis = async (): Promise<void> => {
  if (redisClient) {
    await redisClient.quit().catch(() => redisClient?.disconnect());
    redisClient = null;
    redisReady = false;
  }
};
