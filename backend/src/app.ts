import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import compression from 'compression';
import { config } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import authRoutes from './routes/auth.routes';
import expenseRoutes from './routes/expenses.routes';
import familyRoutes from './routes/family.routes';
import analyticsRoutes from './routes/analytics.routes';
import exportRoutes from './routes/export.routes';
import categoriesRoutes from './routes/categories.routes';
import budgetsRoutes from './routes/budgets.routes';
import { requestLogger, requestIdMiddleware } from './middleware/requestLogger';
import { apiRateLimiter } from './middleware/rateLimiter';
import { sanitizer } from './middleware/sanitizer';
import { mongoSanitizer } from './middleware/mongoSanitizer';
import { securityHeaders } from './middleware/securityHeaders';
import { apiVersionHeader } from './middleware/versioning';

// SAFEGUARD IMPORTS - Phase 1: Foundation
import { monitoringService, startMetricsCollection } from './services/monitoringService';
import { optimizeDatabase, ensureIndexes, setupQueryMonitoring, startConnectionHealthCheck, monitorMemoryPressure } from './config/databaseOptimization';
import { connectDB } from './config/database';

// SAFEGUARD IMPORTS - Phase 2: Core Protection
import { idempotencyHandler, duplicateDetectionMiddleware } from './middleware/idempotencyHandler';

// SAFEGUARD IMPORTS - Phase 3: Advanced Protection
import { CircuitBreaker, Bulkhead, withResilience } from './services/circuitBreaker';
import { AuditLogService } from './models/AuditLog';

const app: Application = express();

// ============================================================================
// MONITORING MIDDLEWARE - Records all request metrics
// ============================================================================
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();

  // Intercept res.json to record metrics
  const originalJson = res.json.bind(res);
  res.json = function (data: any) {
    const duration = Date.now() - start;

    // Record metric
    monitoringService.recordMetric({
      endpoint: req.path,
      method: req.method,
      statusCode: res.statusCode,
      duration: duration,
      timestamp: new Date(),
      userId: (req as any).user?.userId,
    });

    return originalJson(data);
  };

  next();
});

// ============================================================================
// CORE MIDDLEWARE
// ============================================================================
app.use(securityHeaders); // hardened helmet config - CSP, HSTS, cross-origin resource policy, etc. (middleware/securityHeaders.ts)
app.use(requestIdMiddleware); // stamps req.requestId / X-Request-Id for cross-service log correlation
app.use(apiVersionHeader); // X-API-Version response header (middleware/versioning.ts)
app.use(
  compression({
    // SCALABILITY: gzip/br-compress JSON responses. Analytics/export payloads
    // can be hundreds of KB of JSON - compression typically shrinks that
    // 70-90%, which matters far more for mobile/slow-network clients than
    // for server CPU (compression is cheap relative to the DB work already
    // done to build the response).
    threshold: 1024, // don't bother compressing tiny responses (health checks etc.) - not worth the CPU
    filter: (req: Request, res: Response) => {
      if (req.headers['x-no-compression']) return false; // escape hatch for debugging/load-testing
      return compression.filter(req, res);
    },
  }),
);
app.use(requestLogger);

// ============================================================================
// PERFORMANCE OPTIMIZATION MIDDLEWARE
// ============================================================================
// Add HTTP caching headers for public endpoints
app.use((req: Request, res: Response, next: NextFunction) => {
  // Cache analytics and category endpoints for 5 minutes
  if (req.path.includes('/analytics') || req.path.includes('/categories')) {
    res.set('Cache-Control', 'public, max-age=300');
  }
  // Cache health check endpoints for 30 seconds
  if (req.path.includes('/health')) {
    res.set('Cache-Control', 'public, max-age=30');
  }
  // Don't cache expense mutations
  if (['POST', 'PUT', 'DELETE'].includes(req.method)) {
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  }
  next();
});

// Initialize query monitoring after database connection is established
if (config.nodeEnv === 'production' || config.nodeEnv === 'development') {
  setupQueryMonitoring();
  console.log('✅ Query monitoring initialized');
}

// SECURITY HARDENING: explicit allow-list. Extra origins (e.g. a staging
// frontend URL) can be added without a code change via CORS_EXTRA_ORIGINS
// (comma-separated) so this list doesn't need to be redeployed alongside
// every new environment.
const extraOrigins = (process.env.CORS_EXTRA_ORIGINS || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

const allowedOrigins: Array<string | RegExp> = [
  config.frontend.url,
  'http://localhost:3000',
  'http://localhost:5173',
  'https://localhost:5173',
  /vercel\.app$/, // Allow all Vercel domains
  ...extraOrigins,
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  // Explicit allow-lists instead of CORS defaults: the browser preflight
  // (OPTIONS) is then rejected outright for anything the API doesn't
  // actually support, rather than silently allowing it through.
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id', 'Idempotency-Key'],
  exposedHeaders: ['X-Request-Id', 'X-API-Version', 'X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset', 'Retry-After'],
  maxAge: 86400, // cache the preflight result for 24h - fewer OPTIONS round-trips under load
}));
// REQUEST SIZE LIMITS: kept at the historical 10mb default (config.bodyLimit)
// so this is a zero-behavior-change deploy. Override via BODY_LIMIT env var
// per environment - no endpoint in this API accepts file uploads through
// the JSON body today (receipts are stored as a URL string), so 1-2mb is
// realistic for a hardened production value once you've confirmed that
// with real traffic.
app.use(express.json({ limit: config.bodyLimit }));
app.use(express.urlencoded({ limit: config.bodyLimit, extended: true }));
app.use(mongoSanitizer); // strip Mongo operator keys ($ne, $where, dotted paths) - NoSQL injection prevention
app.use(sanitizer); // HTML-encode/strip XSS payloads from string fields

// Apply rate limiting to all API endpoints (auth routes have their own individual limiters)
app.use('/api', apiRateLimiter);

// ============================================================================
// SAFEGUARD MIDDLEWARE - Phase 2: Duplicate Prevention & Idempotency
// ============================================================================
app.use('/api', idempotencyHandler);
app.use('/api', duplicateDetectionMiddleware);

// ============================================================================
// HEALTH CHECK ENDPOINTS
// ============================================================================

// Basic health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      status: 'OK',
      timestamp: new Date().toISOString(),
      environment: config.nodeEnv,
    },
  });
});

// Detailed system health metrics
app.get('/health/metrics', (_req: Request, res: Response) => {
  const health = monitoringService.getSystemHealth();
  const statusCode = health.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json({
    success: true,
    data: health,
  });
});

// Anomaly detection
app.get('/health/anomalies', (_req: Request, res: Response) => {
  const anomalies = monitoringService.detectAnomalies();
  res.json({
    success: true,
    data: anomalies,
  });
});

// Latency statistics
app.get('/health/latency', (_req: Request, res: Response) => {
  const latency = monitoringService.getLatencyStats();
  res.json({
    success: true,
    data: latency,
  });
});

// Error statistics
app.get('/health/errors', (_req: Request, res: Response) => {
  const errors = monitoringService.getErrorStats();
  res.json({
    success: true,
    data: errors,
  });
});

// ============================================================================
// MONITORING DASHBOARD ENDPOINTS
// ============================================================================

// Comprehensive monitoring dashboard
app.get('/admin/dashboard', (_req: Request, res: Response) => {
  const health = monitoringService.getSystemHealth();
  const anomalies = monitoringService.detectAnomalies();

  res.json({
    success: true,
    data: {
      system: health,
      anomalies,
      timestamp: new Date().toISOString(),
    },
  });
});

// ============================================================================
// API ROUTES - mounted at both /api (unversioned, permanent alias for the
// current frontend build) and /api/v1 (explicit version for new/future
// clients). See middleware/versioning.ts for the full strategy - future
// breaking changes ship as a new /api/v2 mount, this one never changes shape.
// ============================================================================
const apiRouter = express.Router();
apiRouter.use('/auth', authRoutes);
apiRouter.use('/expenses', expenseRoutes);
apiRouter.use('/families', familyRoutes);
apiRouter.use('/analytics', analyticsRoutes);
apiRouter.use('/export', exportRoutes);
apiRouter.use('/categories', categoriesRoutes);
apiRouter.use('/budgets', budgetsRoutes);

app.use('/api', apiRouter);
app.use('/api/v1', apiRouter);

// 404 Handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: 'Route not found' },
  });
});

// Error Handler (must be last)
app.use(errorHandler);

export default app;
