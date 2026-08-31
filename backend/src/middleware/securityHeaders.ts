import helmet from 'helmet';

/**
 * Hardened security headers for a pure JSON API.
 *
 * This replaces the previous bare `helmet()` call (which is a reasonable
 * baseline but leaves several defaults untuned for an API-only backend
 * consumed cross-origin by a separate frontend deployment):
 *
 * - contentSecurityPolicy: `default-src 'none'` - this server never returns
 *   HTML/JS/CSS that a browser should execute, so the strictest possible
 *   CSP is safe and blocks any XSS payload that somehow got reflected from
 *   ending up executable.
 * - crossOriginResourcePolicy: 'cross-origin' - the frontend is hosted on a
 *   different origin (Vercel) than this API (see config/env.ts
 *   `frontend.url` / the CORS allow-list below). Helmet's default
 *   ('same-origin') is meant for same-origin apps and can cause browsers to
 *   block legitimate cross-origin fetches; 'cross-origin' is the correct,
 *   still-safe setting when CORS is already the access-control boundary.
 * - hsts: force HTTPS for a full 2 years including subdomains once a client
 *   has seen it once (only takes effect when actually served over HTTPS,
 *   e.g. behind Render/Vercel's TLS termination).
 * - referrerPolicy: never leak full URLs (which may contain family/expense
 *   IDs) to third-party referrers.
 * - frameguard: deny framing entirely - this API has no UI to clickjack,
 *   so there's no reason to ever allow it in a frame.
 */
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'none'"],
      frameAncestors: ["'none'"],
    },
  },
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  hsts: {
    maxAge: 63072000, // 2 years
    includeSubDomains: true,
    preload: true,
  },
  referrerPolicy: { policy: 'no-referrer' },
  frameguard: { action: 'deny' },
  noSniff: true,
});
