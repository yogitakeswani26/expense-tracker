import express, { Application, Request, Response } from 'express';
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
import { requestLogger } from './middleware/requestLogger';
import { authRateLimiter, apiRateLimiter } from './middleware/rateLimiter';
import { sanitizer } from './middleware/sanitizer';

const app: Application = express();

// Middleware
app.use(helmet());
app.use(requestLogger);

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

// Apply rate limiting to auth endpoints (stricter)
app.use('/api/auth', authRateLimiter);
// Apply rate limiting to all other endpoints
app.use('/api', apiRateLimiter);

// Health check
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

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/families', familyRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/categories', categoriesRoutes);

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
