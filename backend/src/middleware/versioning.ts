import { Request, Response, NextFunction } from 'express';

/**
 * API VERSIONING STRATEGY
 *
 * - The API is mounted at both `/api/*` (unversioned - kept forever for the
 *   current frontend build, which calls these paths today) and `/api/v1/*`
 *   (explicit version, identical router). `/api/*` is treated as a
 *   permanent alias of `/api/v1/*`, not a separate surface to maintain.
 * - Every response carries an `X-API-Version` header so clients/monitoring
 *   can see which contract they're talking to even when they hit the
 *   unversioned path.
 * - BREAKING changes (removed fields, changed status codes, renamed routes)
 *   only ever ship under a new `/api/v2/*` mount, added alongside `/v1`
 *   without touching it. Additive changes (new optional fields, new routes)
 *   can land in the current version directly.
 * - Deprecation flow for a version: announce -> mark responses with
 *   `Deprecation`/`Sunset` headers (see `deprecated()` below) for a fixed
 *   window -> remove the mount once analytics show near-zero traffic.
 */
export const CURRENT_API_VERSION = 'v1';

export const apiVersionHeader = (req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-API-Version', CURRENT_API_VERSION);
  next();
};

/** Mark a route (or an entire router) as deprecated ahead of removal in a future major version. */
export const deprecated = (sunsetDate: string, info?: string) => (req: Request, res: Response, next: NextFunction) => {
  res.setHeader('Deprecation', 'true');
  res.setHeader('Sunset', sunsetDate);
  if (info) res.setHeader('Link', `<${info}>; rel="deprecation"`);
  next();
};
