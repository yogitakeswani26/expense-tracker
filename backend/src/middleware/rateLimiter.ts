import { Request, Response, NextFunction } from 'express';

interface RateLimitStore {
  [key: string]: { count: number; resetTime: number };
}

const store: RateLimitStore = {};

// Cleanup old entries every 10 minutes to prevent memory leak
setInterval(() => {
  const now = Date.now();
  for (const key in store) {
    if (store[key].resetTime < now) {
      delete store[key];
    }
  }
}, 10 * 60 * 1000);

export const rateLimiter = (windowMs: number = 1 * 60 * 1000, maxRequests: number = 30) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Get real IP (account for reverse proxies)
    const key = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.ip || 'unknown';
    const now = Date.now();

    if (!store[key]) {
      store[key] = { count: 1, resetTime: now + windowMs };
      res.setHeader('X-RateLimit-Limit', maxRequests);
      res.setHeader('X-RateLimit-Remaining', maxRequests - 1);
      res.setHeader('X-RateLimit-Reset', new Date(store[key].resetTime).toISOString());
      return next();
    }

    if (now > store[key].resetTime) {
      store[key] = { count: 1, resetTime: now + windowMs };
      res.setHeader('X-RateLimit-Limit', maxRequests);
      res.setHeader('X-RateLimit-Remaining', maxRequests - 1);
      res.setHeader('X-RateLimit-Reset', new Date(store[key].resetTime).toISOString());
      return next();
    }

    store[key].count++;

    if (store[key].count > maxRequests) {
      const retryAfter = Math.ceil((store[key].resetTime - now) / 1000);
      res.setHeader('Retry-After', retryAfter);
      return res.status(429).json({
        success: false,
        error: {
          code: 'TOO_MANY_REQUESTS',
          message: `Too many requests. Please try again in ${retryAfter} seconds.`,
        },
      });
    }

    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', maxRequests - store[key].count);
    res.setHeader('X-RateLimit-Reset', new Date(store[key].resetTime).toISOString());

    next();
  };
};

// 10 requests per minute for auth (signup, login, refresh)
export const authRateLimiter = rateLimiter(1 * 60 * 1000, 10);

// 60 requests per minute for API (expenses, family, analytics)
export const apiRateLimiter = rateLimiter(1 * 60 * 1000, 60);
