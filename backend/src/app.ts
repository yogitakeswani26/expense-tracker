import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import authRoutes from './routes/auth.routes';
import expenseRoutes from './routes/expenses.routes';
import familyRoutes from './routes/family.routes';
import analyticsRoutes from './routes/analytics.routes';
import exportRoutes from './routes/export.routes';
import categoriesRoutes from './routes/categories.routes';
import budgetsRoutes from './routes/budgets.routes';
import { requestLogger } from './middleware/requestLogger';
import { apiRateLimiter } from './middleware/rateLimiter';
import { sanitizer } from './middleware/sanitizer';

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
app.use(helmet());
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

const allowedOrigins = [
  config.frontend.url,
  'http://localhost:3000',
  'http://localhost:5173',
  'https://localhost:5173',
  /vercel\.app$/, // Allow all Vercel domains
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(sanitizer);

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

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/families', familyRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/budgets', budgetsRoutes);

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
