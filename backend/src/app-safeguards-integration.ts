/**
 * INTEGRATION REFERENCE: How to add all safeguards to app.ts
 *
 * This file shows exactly where and how to integrate each safeguard
 * into the existing Express app.
 *
 * Copy these sections into app.ts one at a time and test
 */

import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import authRoutes from './routes/auth.routes';
import expenseRoutes from './routes/expenses.routes';
import { requestLogger } from './middleware/requestLogger';
import { apiRateLimiter } from './middleware/rateLimiter';
import { sanitizer } from './middleware/sanitizer';

// ============================================================================
// PHASE 1: FOUNDATION SAFEGUARDS (Week 1)
// ============================================================================

// SAFEGUARD 1: Transaction Handler (for multi-document operations)
// Usage: See backend/src/middleware/transactionHandler.ts
// No integration needed - import where needed

// SAFEGUARD 2: Monitoring Service
import { monitoringService, startMetricsCollection } from './services/monitoringService';

// SAFEGUARD 3: Database Optimization
import { optimizeDatabase, ensureIndexes, setupQueryMonitoring,
         startConnectionHealthCheck } from './config/databaseOptimization';

// Update database connection to use optimizations
// (This is done in config/database.ts, not app.ts)
/*
export const connectDB = async () => {
  try {
    const uri = config.nodeEnv === 'test' ? config.mongodb.testUri : config.mongodb.uri;
    await mongoose.connect(uri);
    const connection = mongoose.connection;

    // ADD THESE LINES:
    optimizeDatabase(connection);
    await ensureIndexes(connection);
    setupQueryMonitoring();
    startConnectionHealthCheck(connection);

    console.log('✅ MongoDB connected with optimizations');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
};
*/

const app: Application = express();

// ============================================================================
// MONITORING MIDDLEWARE (Phase 1)
// ============================================================================

// Add metrics recording to every request
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

// Health check endpoint (Phase 1)
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

// Metrics endpoint (Phase 1)
app.get('/health/metrics', (_req: Request, res: Response) => {
  const health = monitoringService.getSystemHealth();
  const statusCode = health.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(health);
});

// ============================================================================
// EXISTING MIDDLEWARE (unchanged)
// ============================================================================

app.use(helmet());
app.use(requestLogger);

const allowedOrigins = [
  config.frontend.url,
  'http://localhost:3000',
  'http://localhost:5173',
  'https://localhost:5173',
  /vercel\.app$/,
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(sanitizer);
app.use('/api', apiRateLimiter);

// ============================================================================
// PHASE 2: CORE PROTECTIONS (Week 2)
// ============================================================================

// SAFEGUARD 4: Idempotency Handler
import { idempotencyHandler, duplicateDetectionMiddleware } from './middleware/idempotencyHandler';

// Add BEFORE routes (after rate limiter)
app.use('/api', idempotencyHandler);
app.use('/api', duplicateDetectionMiddleware);

// ============================================================================
// API ROUTES (existing)
// ============================================================================

app.use('/api/auth', authRoutes);
app.use('/api/expenses', expenseRoutes);
// ... other routes

// ============================================================================
// PHASE 3: ADVANCED PROTECTION (Week 3)
// ============================================================================

// SAFEGUARD 5: Use Optimized Analytics Service
// (Replace in analyticsService.ts or routes/analytics.routes.ts)
// import { analyticsServiceOptimized } from './services/analyticsServiceOptimized';

// SAFEGUARD 6: Use Optimized Recurring Service
// (Replace in recurringService.ts)
// import { recurringServiceOptimized } from './services/recurringServiceOptimized';

// SAFEGUARD 7: Audit Logging
// (Add to model save/update hooks)
// import { AuditLogService } from './models/AuditLog';

// ============================================================================
// PHASE 4: MONITORING & ALERTING (Week 4)
// ============================================================================

// Start metrics collection on server startup
// (Add to index.ts in startServer function)
/*
const startServer = async () => {
  try {
    // ... existing code ...

    const server = app.listen(config.port, () => {
      console.log(`🚀 Server running on port ${config.port}`);

      // ADD THIS LINE:
      startMetricsCollection(60000); // Record metrics every minute
    });

    // ... rest of code ...
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};
*/

// ============================================================================
// ERROR HANDLER (must be last)
// ============================================================================

// 404 Handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: 'Route not found' },
  });
});

// Error Handler (must be absolute last)
app.use(errorHandler);

export default app;

// ============================================================================
// INTEGRATION SUMMARY
// ============================================================================

/*
STEP-BY-STEP INTEGRATION:

1. In config/database.ts:
   - Import { optimizeDatabase, ensureIndexes, setupQueryMonitoring, startConnectionHealthCheck }
   - Add these 4 function calls after mongoose.connect()

2. In app.ts:
   - Import { monitoringService, startMetricsCollection }
   - Import { idempotencyHandler, duplicateDetectionMiddleware }
   - Add metrics recording middleware (shown above)
   - Add /health and /health/metrics endpoints
   - Add idempotencyHandler middleware
   - Add duplicateDetectionMiddleware middleware

3. In index.ts (startServer function):
   - Call startMetricsCollection(60000) after server.listen()

4. In routes/expenses.routes.ts:
   - Wrap multi-document operations in TransactionHandler.executeInTransaction()
   - Add audit logging to create/update/delete endpoints

5. In services/analyticsService.ts:
   - Replace with analyticsServiceOptimized or call aggregation pipeline

6. In services/recurringService.ts:
   - Replace with recurringServiceOptimized for locking support

7. For external services (email, SMS, payment):
   - Create CircuitBreaker instances
   - Wrap calls with withResilience()

8. In middleware/authMiddleware.ts (if email used):
   - Create emailCircuit = new CircuitBreaker('email')
   - Use withResilience when sending emails

9. Set up monitoring dashboard:
   - Poll /health/metrics every 60 seconds
   - Create Grafana/Datadog dashboard
   - Set up alerts for status != 'healthy'

10. Add audit logging to models:
    - Import { AuditLogService } in services
    - Call AuditLogService.logChange() after state changes

TESTING EACH PHASE:

Phase 1 (Foundation):
- npm run test -- monitoringService.test.ts
- curl http://localhost:8000/health
- curl http://localhost:8000/health/metrics

Phase 2 (Core):
- Send duplicate idempotency key, verify cache hit
- Restart app 2x, verify metrics still collect

Phase 3 (Advanced):
- Load test with 100k expenses, measure latency
- Stop email service, verify circuit breaks
- Check audit logs are recording

Phase 4 (Monitoring):
- Set up dashboard
- Trigger alert conditions
- Verify alerts fire

ROLLBACK:
- Remove safeguard imports/middleware
- Keep audit logs (useful for debugging)
- Revert to original code commit
- Test all endpoints still work
*/
