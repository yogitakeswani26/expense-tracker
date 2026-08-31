import { Request, Response, NextFunction } from 'express';

interface RequestTimestamp {
  timestamp: number;
}

interface StoreEntry {
  timestamps: RequestTimestamp[];
  lastAccessed: number;
}

// Use Map instead of plain object for better performance and memory efficiency
const store = new Map<string, StoreEntry>();

// Cleanup configuration
const CLEANUP_INTERVAL = 5 * 60 * 1000; // Run cleanup every 5 minutes
const ENTRY_TTL = 15 * 60 * 1000; // Keep entries for 15 minutes max
const MAX_STORE_SIZE = 10000; // Maximum number of unique IPs to track

/**
 * Automatic cleanup of old entries to prevent memory leak
 * Runs every 5 minutes and removes entries older than 15 minutes
 * Implements LRU eviction when store exceeds max size
 */
const cleanupInterval = setInterval(() => {
  const now = Date.now();
  const keysToDelete: string[] = [];

  for (const [key, entry] of store.entries()) {
    // Filter out requests older than 15 minutes
    const recentRequests = entry.timestamps.filter(req => now - req.timestamp < ENTRY_TTL);

    if (recentRequests.length === 0) {
      // Mark for deletion if no recent requests
      keysToDelete.push(key);
    } else {
      // Update store with filtered requests
      store.set(key, { timestamps: recentRequests, lastAccessed: now });
    }
  }

  // Remove empty entries
  keysToDelete.forEach(key => store.delete(key));

  // OPTIMIZATION: Implement LRU eviction when store exceeds max size
  if (store.size > MAX_STORE_SIZE) {
    const entries = Array.from(store.entries())
      .sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);

    // Remove oldest 10% of entries
    const toRemove = Math.ceil(store.size * 0.1);
    for (let i = 0; i < toRemove; i++) {
      store.delete(entries[i][0]);
    }
  }
}, CLEANUP_INTERVAL);

/**
 * Graceful shutdown: Clear cleanup interval
 * Call this in your server shutdown handler
 */
export const stopRateLimiterCleanup = () => {
  clearInterval(cleanupInterval);
};

/**
 * Extract real client IP address, handling reverse proxies (Nginx, CloudFlare, etc.)
 */
function getClientIp(req: Request): string {
  // Check X-Forwarded-For header first (set by reverse proxies)
  const xForwardedFor = req.headers['x-forwarded-for'];
  if (xForwardedFor) {
    // Handle both string and array (depending on Express config)
    const ip = Array.isArray(xForwardedFor)
      ? xForwardedFor[0]
      : xForwardedFor.split(',')[0];
    return ip.trim();
  }

  // Fallback to req.ip (works without reverse proxy)
  return req.ip || 'unknown';
}

/**
 * Sliding window rate limiter using timestamp tracking
 * More accurate than fixed window - tracks actual request times within rolling window
 *
 * @param windowMs - Time window in milliseconds (default: 60 seconds)
 * @param maxRequests - Max requests allowed in window (default: 30)
 */
export const rateLimiter = (windowMs: number = 60 * 1000, maxRequests: number = 30) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const clientIp = getClientIp(req);
    const now = Date.now();
    const windowStart = now - windowMs;

    // Initialize if first request from this IP
    if (!store.has(clientIp)) {
      store.set(clientIp, { timestamps: [{ timestamp: now }], lastAccessed: now });
      res.setHeader('X-RateLimit-Limit', maxRequests);
      res.setHeader('X-RateLimit-Remaining', maxRequests - 1);
      res.setHeader('X-RateLimit-Reset', new Date(now + windowMs).toISOString());
      return next();
    }

    // Get stored requests for this IP
    const entry = store.get(clientIp);
    if (!entry) {
      res.setHeader('X-RateLimit-Limit', maxRequests);
      res.setHeader('X-RateLimit-Remaining', maxRequests - 1);
      res.setHeader('X-RateLimit-Reset', new Date(now + windowMs).toISOString());
      return next();
    }

    let requests = entry.timestamps;

    // Remove requests outside the current sliding window
    requests = requests.filter(req => req.timestamp > windowStart);

    // Check if rate limit is exceeded
    if (requests.length >= maxRequests) {
      const oldestRequest = requests[0].timestamp;
      const retryAfter = Math.ceil((oldestRequest + windowMs - now) / 1000);

      res.setHeader('Retry-After', retryAfter);
      res.setHeader('X-RateLimit-Limit', maxRequests);
      res.setHeader('X-RateLimit-Remaining', 0);
      res.setHeader('X-RateLimit-Reset', new Date(oldestRequest + windowMs).toISOString());

      return res.status(429).json({
        success: false,
        error: {
          code: 'TOO_MANY_REQUESTS',
          message: `Too many requests. Please try again in ${retryAfter} seconds.`,
        },
      });
    }

    // Record current request and update last accessed
    requests.push({ timestamp: now });
    store.set(clientIp, { timestamps: requests, lastAccessed: now });

    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', maxRequests - requests.length);
    res.setHeader('X-RateLimit-Reset', new Date(now + windowMs).toISOString());

    next();
  };
};

/**
 * Auth rate limiters with less aggressive limits
 * Signup: 10 requests per minute
 * Login: 10 requests per minute
 * Refresh: 30 requests per minute (higher for token refresh in background)
 */
export const signupRateLimiter = rateLimiter(60 * 1000, 10);
export const loginRateLimiter = rateLimiter(60 * 1000, 10);
export const refreshRateLimiter = rateLimiter(60 * 1000, 30);

// Backwards compatibility
export const authRateLimiter = loginRateLimiter;

/**
 * API rate limiters
 * General API: 30 requests per minute (less aggressive than before)
 */
export const apiRateLimiter = rateLimiter(60 * 1000, 30);
