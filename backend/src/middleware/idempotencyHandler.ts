import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

/**
 * Idempotency Key Handler
 *
 * PROBLEM: Without idempotency, duplicate requests create multiple expenses
 * - User clicks submit twice
 * - Network timeout, client retries
 * - Result: Two expenses instead of one
 *
 * SOLUTION: Track request by idempotency key
 * - Client sends unique key
 * - Server caches response
 * - Duplicate requests get cached response
 *
 * EXAMPLE:
 * POST /api/expenses/familyId
 * Idempotency-Key: exp-12345-unique-key
 *
 * First request: Creates expense, caches response
 * Second request: Returns cached response (no duplicate)
 */

interface CachedResponse {
  statusCode: number;
  data: any;
  timestamp: number;
}

// In-memory cache (replace with Redis in production)
const idempotencyCache = new Map<string, CachedResponse>();

// Cache TTL: 24 hours
const CACHE_TTL = 24 * 60 * 60 * 1000;

// Cleanup old cache entries every hour
setInterval(() => {
  const now = Date.now();
  let cleanedCount = 0;

  for (const [key, value] of idempotencyCache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      idempotencyCache.delete(key);
      cleanedCount++;
    }
  }

  if (cleanedCount > 0) {
    console.log(`🧹 Cleaned ${cleanedCount} idempotency cache entries`);
  }
}, 60 * 60 * 1000);

/**
 * Middleware to handle idempotent requests
 *
 * Apply to POST endpoints for expense creation, transfers, etc.
 */
export const idempotencyHandler = (req: Request, res: Response, next: NextFunction) => {
  // Only apply to POST/PUT/PATCH requests
  if (!['POST', 'PUT', 'PATCH'].includes(req.method)) {
    return next();
  }

  const idempotencyKey = req.headers['idempotency-key'] as string;

  // If no key provided, generate one (not ideal but better than failing)
  if (!idempotencyKey) {
    // Extract user ID and operation from request to create a key
    const uniqueId = crypto.randomBytes(16).toString('hex');
    req.headers['idempotency-key'] = uniqueId;
    return next();
  }

  // Create cache key: userId-idempotencyKey
  const userId = (req as any).user?.userId || 'anonymous';
  const cacheKey = `${userId}-${idempotencyKey}`;

  // Check if we've seen this request before
  const cached = idempotencyCache.get(cacheKey);

  if (cached) {
    // Return cached response
    console.log(`♻️  Returning cached response for idempotency key: ${idempotencyKey}`);
    return res.status(cached.statusCode).json(cached.data);
  }

  // Intercept res.json to cache the response
  const originalJson = res.json.bind(res);

  res.json = function (data: any) {
    // Cache the response
    idempotencyCache.set(cacheKey, {
      statusCode: res.statusCode,
      data: data,
      timestamp: Date.now(),
    });

    // Send response
    return originalJson(data);
  };

  next();
};

/**
 * Generate idempotency key on client side
 * Use this in frontend to create consistent keys
 */
export function generateIdempotencyKey(
  userId: string,
  operationType: string,
  uniqueIdentifier?: string
): string {
  const timestamp = Date.now();
  const random = crypto.randomBytes(8).toString('hex');

  return `${operationType}-${timestamp}-${random}`;
}

/**
 * Detect duplicate requests by fingerprinting
 *
 * PROBLEM: Client might not send idempotency key
 * SOLUTION: Fingerprint request to detect duplicates
 *
 * EXAMPLE: Same expense with same amount, date, category within 10 seconds
 */
export function createRequestFingerprint(req: Request): string {
  const body = JSON.stringify(req.body);
  const userId = (req as any).user?.userId || 'anonymous';

  return crypto
    .createHash('sha256')
    .update(`${userId}-${req.method}-${req.path}-${body}`)
    .digest('hex');
}

export interface DuplicateDetectorConfig {
  timeWindowMs?: number; // How recent a duplicate must be (default: 10s)
  ignoreFields?: string[]; // Fields to ignore in comparison
}

export class DuplicateDetector {
  private recentRequests = new Map<string, { timestamp: number; count: number }>();
  private config: Required<DuplicateDetectorConfig>;

  constructor(config: DuplicateDetectorConfig = {}) {
    this.config = {
      timeWindowMs: config.timeWindowMs || 10000,
      ignoreFields: config.ignoreFields || [],
    };

    // Cleanup old entries every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  /**
   * Check if request is a duplicate
   */
  isDuplicate(fingerprint: string): boolean {
    const existing = this.recentRequests.get(fingerprint);

    if (!existing) {
      return false;
    }

    const age = Date.now() - existing.timestamp;

    if (age > this.config.timeWindowMs) {
      // Outside time window, not a duplicate
      this.recentRequests.delete(fingerprint);
      return false;
    }

    // Within time window, increment counter
    existing.count++;
    return true;
  }

  /**
   * Record request
   */
  record(fingerprint: string): void {
    const existing = this.recentRequests.get(fingerprint);

    if (existing) {
      existing.timestamp = Date.now();
    } else {
      this.recentRequests.set(fingerprint, {
        timestamp: Date.now(),
        count: 1,
      });
    }
  }

  /**
   * Get duplicate count
   */
  getDuplicateCount(fingerprint: string): number {
    return this.recentRequests.get(fingerprint)?.count || 0;
  }

  /**
   * Cleanup old entries
   */
  private cleanup(): void {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [fingerprint, data] of this.recentRequests.entries()) {
      if (now - data.timestamp > this.config.timeWindowMs) {
        this.recentRequests.delete(fingerprint);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`🧹 Cleaned ${cleanedCount} duplicate detector entries`);
    }
  }
}

export const duplicateDetector = new DuplicateDetector();

/**
 * Middleware to detect duplicate requests
 */
export const duplicateDetectionMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Only apply to state-changing requests
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    return next();
  }

  const fingerprint = createRequestFingerprint(req);

  if (duplicateDetector.isDuplicate(fingerprint)) {
    const count = duplicateDetector.getDuplicateCount(fingerprint);
    console.warn(`⚠️  Duplicate request detected (count: ${count}): ${req.method} ${req.path}`);

    // Don't reject, but log it
    // In production, might want to fail fast on too many duplicates
    if (count > 5) {
      return res.status(429).json({
        success: false,
        error: { code: 'DUPLICATE_REQUEST', message: 'Too many duplicate requests' },
      });
    }
  } else {
    duplicateDetector.record(fingerprint);
  }

  next();
};
