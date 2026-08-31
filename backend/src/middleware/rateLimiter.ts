import { Request, Response, NextFunction } from 'express';

interface RequestTimestamp {
  timestamp: number;
}

interface RateLimitStore {
  [key: string]: RequestTimestamp[];
}

const store: RateLimitStore = {};

// Cleanup old entries every 5 minutes to prevent memory leak
setInterval(() => {
  const now = Date.now();
  for (const key in store) {
    // Keep only recent timestamps (within 2 minutes)
    store[key] = store[key].filter(req => now - req.timestamp < 2 * 60 * 1000);
    // Delete key if empty
    if (store[key].length === 0) {
      delete store[key];
    }
  }
}, 5 * 60 * 1000);

/**
 * Sliding window rate limiter using timestamp tracking
 * More accurate than fixed window as it tracks actual request times
 */
export const rateLimiter = (windowMs: number = 60 * 1000, maxRequests: number = 5) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Get real IP (account for reverse proxies)
    const key = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.ip || 'unknown';
    const now = Date.now();
    const windowStart = now - windowMs;

    // Initialize if first request
    if (!store[key]) {
      store[key] = [{ timestamp: now }];
      res.setHeader('X-RateLimit-Limit', maxRequests);
      res.setHeader('X-RateLimit-Remaining', maxRequests - 1);
      res.setHeader('X-RateLimit-Reset', new Date(now + windowMs).toISOString());
      return next();
    }

    // Remove expired requests (older than window)
    store[key] = store[key].filter(req => req.timestamp > windowStart);

    // Check if limit exceeded
    if (store[key].length >= maxRequests) {
      const oldestRequest = store[key][0].timestamp;
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

    // Add current request to store
    store[key].push({ timestamp: now });

    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', maxRequests - store[key].length);
    res.setHeader('X-RateLimit-Reset', new Date(now + windowMs).toISOString());

    next();
  };
};

/**
 * Auth rate limiters with different strategies
 * Signup: 10 requests per 60 seconds (account creation is slower)
 * Login: 5 requests per 60 seconds (prevent brute force)
 * Refresh: 20 requests per 60 seconds (happens in background)
 */
export const signupRateLimiter = rateLimiter(60 * 1000, 10);
export const loginRateLimiter = rateLimiter(60 * 1000, 5);
export const refreshRateLimiter = rateLimiter(60 * 1000, 20);

// Backwards compatibility
export const authRateLimiter = loginRateLimiter;

/**
 * API rate limiters
 * General API: 60 requests per 60 seconds
 */
export const apiRateLimiter = rateLimiter(60 * 1000, 60);
