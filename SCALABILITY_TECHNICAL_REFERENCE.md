# Expense Tracker - Technical Scalability Reference

## Architecture Overview

### Current Architecture (Pre-Scale)
```
┌─────────────────────────────────────────────┐
│         Frontend (React + Vite)             │
│         Deployed on Vercel                  │
└────────────┬────────────────────────────────┘
             │ HTTPS
             │
┌────────────▼────────────────────────────────┐
│      Backend (Express + Node.js)            │
│      Single instance on Render              │
│      ✓ Rate limiting                        │
│      ✓ Input validation                     │
│      ✓ Middleware stack                     │
└────────────┬────────────────────────────────┘
             │
┌────────────▼────────────────────────────────┐
│     Database (MongoDB Atlas M0)             │
│     Single instance, no replication         │
│     ✓ Strategic indexes                     │
│     ✓ Audit logging                         │
└─────────────────────────────────────────────┘

Capacity: ~100K users, 5K concurrent
Bottleneck: Single database instance
```

### Phase 1 Architecture (With Caching & Queues)
```
┌─────────────────────────────────────────────┐
│         Frontend (React + Vite)             │
│         Deployed on Vercel                  │
└────────────┬────────────────────────────────┘
             │
┌────────────▼────────────────────────────────┐
│      Load Balancer (Render or AWS)          │
│      ✓ Health checks                        │
│      ✓ Sticky sessions (WebSocket)          │
└────────────┬────────────────────────────────┘
             │
       ┌─────┴──────┬──────────┐
       │            │          │
   ┌───▼───┐   ┌───▼───┐  ┌──▼───┐
   │ API 1 │   │ API 2 │  │API 3 │ (Horizontal scaling)
   │       │   │       │  │      │
   │ Exp   │   │ Exp   │  │Exp   │ (All instances share caches)
   └───┬───┘   └───┬───┘  └───┬──┘
       │            │          │
       └────────────┬──────────┘
                    │
    ┌───────────────┼───────────────┐
    │               │               │
    ▼               ▼               ▼
┌────────┐   ┌──────────┐   ┌──────────┐
│ Redis  │   │ MongoDB  │   │ Message  │
│ Cache  │   │ Replica  │   │ Queue    │
│(2GB)   │   │ Set      │   │(Bull)    │
└────────┘   └──────────┘   └──────────┘

Capacity: ~500K users, 20K concurrent
Bottleneck: Database query patterns, synchronous processing
```

### Phase 2 Architecture (Microservices & K8s)
```
                    ┌─────────────────┐
                    │  CloudFlare CDN │
                    │  (DDoS, caching)│
                    └────────┬────────┘
                             │
    ┌────────────────────────┼────────────────────────┐
    │                        │                        │
    ▼                        ▼                        ▼
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│  API (US)   │      │API (EU)     │      │  API (APAC) │
│  3-5 pods   │      │  3-5 pods   │      │  3-5 pods   │
└─────────────┘      └─────────────┘      └─────────────┘
    │                    │                        │
    └────────────────────┼────────────────────────┘
                         │
              ┌──────────┴──────────┐
              │   API Gateway      │
              │   (Nginx/Kong)     │
              └─────────┬──────────┘
              │         │         │         │
         ┌────▼┐   ┌────▼┐  ┌────▼┐  ┌────▼┐
         │Auth │   │Exp  │  │Ana  │  │Noti │
         │Svc  │   │Svc  │  │Svc  │  │Svc  │
         │2-3  │   │3-5  │  │2-3  │  │1-2  │
         │pods │   │pods │  │pods │  │pods │
         └─────┘   └─────┘  └─────┘  └─────┘
              │              │
         ┌────▼──────────────▼────┐
         │  Message Queue (Kafka) │
         └─────────┬──────────────┘
              │    │    │
         ┌────▼┐ ┌─▼──┐ ┌▼────┐
         │Redis│ │Mongo│ │S3   │
         │ Cl. │ │ Sh. │ │Arc. │
         └─────┘ └─────┘ └─────┘

Capacity: ~10M users, 100K concurrent
```

---

## Component Implementation Details

### 1. Redis Cache Implementation

**Installation:**
```bash
npm install ioredis
```

**Service Wrapper:**
```typescript
// backend/src/services/cacheService.ts
import Redis from 'ioredis';
import { config } from '../config/env';

export class CacheService {
  private redis: Redis;
  private keyPrefix = 'expense-tracker:';

  constructor() {
    this.redis = new Redis({
      url: config.redis.url,
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      enableOfflineQueue: false,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      }
    });

    this.redis.on('error', (err) => {
      console.error('Redis error:', err);
    });

    this.redis.on('connect', () => {
      console.log('Redis connected');
    });
  }

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.redis.get(this.keyPrefix + key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Set value in cache
   */
  async set<T>(key: string, value: T, ttl: number = 3600): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      if (ttl > 0) {
        await this.redis.setex(this.keyPrefix + key, ttl, serialized);
      } else {
        await this.redis.set(this.keyPrefix + key, serialized);
      }
    } catch (error) {
      console.error(`Cache set error for key ${key}:`, error);
    }
  }

  /**
   * Delete specific key
   */
  async del(key: string): Promise<void> {
    try {
      await this.redis.del(this.keyPrefix + key);
    } catch (error) {
      console.error(`Cache delete error for key ${key}:`, error);
    }
  }

  /**
   * Delete keys matching pattern
   */
  async invalidatePattern(pattern: string): Promise<void> {
    try {
      const keys = await this.redis.keys(this.keyPrefix + pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch (error) {
      console.error(`Cache invalidate error for pattern ${pattern}:`, error);
    }
  }

  /**
   * Increment counter
   */
  async increment(key: string, amount: number = 1): Promise<number> {
    try {
      return await this.redis.incrby(this.keyPrefix + key, amount);
    } catch (error) {
      console.error(`Cache increment error for key ${key}:`, error);
      return 0;
    }
  }

  /**
   * Get or set with lazy loading
   */
  async getOrSet<T>(
    key: string,
    loader: () => Promise<T>,
    ttl: number = 3600
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached) return cached;

    const data = await loader();
    await this.set(key, data, ttl);
    return data;
  }

  /**
   * Health check
   */
  async ping(): Promise<boolean> {
    try {
      await this.redis.ping();
      return true;
    } catch {
      return false;
    }
  }
}

export const cacheService = new CacheService();
```

**Usage in Routes:**
```typescript
// backend/src/routes/expenses.routes.ts
import { Router } from 'express';
import { protect } from '../middleware/authMiddleware';
import { cacheService } from '../services/cacheService';
import { Expense } from '../models/Expense';

const router = Router();

// List expenses with caching
router.get('/', protect, async (req, res) => {
  const { familyId } = req.user;
  const page = parseInt(req.query.page as string) || 0;
  const limit = parseInt(req.query.limit as string) || 50;

  const cacheKey = `expenses:family:${familyId}:page:${page}:limit:${limit}`;

  try {
    const expenses = await cacheService.getOrSet(cacheKey, async () => {
      return await Expense
        .find({ familyId })
        .sort({ date: -1 })
        .limit(limit)
        .skip(page * limit)
        .lean();
    }, 300); // 5 minute TTL

    res.json({ success: true, data: expenses });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create expense and invalidate cache
router.post('/', protect, async (req, res) => {
  const expense = await Expense.create({
    ...req.body,
    familyId: req.user.familyId
  });

  // Invalidate all family expense caches
  await cacheService.invalidatePattern(`expenses:family:${req.user.familyId}:*`);

  res.json({ success: true, data: expense });
});

export default router;
```

---

### 2. Message Queue Implementation

**Installation:**
```bash
npm install bull
```

**Queue Service:**
```typescript
// backend/src/services/queueService.ts
import Queue from 'bull';
import { config } from '../config/env';

export interface JobData {
  [key: string]: any;
}

export class QueueService {
  static queues = {
    notifications: new Queue('notifications', config.redis.url),
    reports: new Queue('reports', config.redis.url),
    analytics: new Queue('analytics', config.redis.url),
    archive: new Queue('archive', config.redis.url),
  };

  /**
   * Add job to notifications queue
   */
  static async addNotification(data: JobData, priority: string = 'normal') {
    return this.queues.notifications.add(data, {
      priority: priority === 'high' ? 100 : 50,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
      removeOnComplete: true,
      removeOnFail: false,
    });
  }

  /**
   * Add report generation job
   */
  static async addReport(data: JobData) {
    return this.queues.reports.add(data, {
      priority: 50,
      attempts: 2,
      backoff: {
        type: 'fixed',
        delay: 5000,
      },
      timeout: 60000, // 1 minute
      removeOnComplete: true,
    });
  }

  /**
   * Process notifications queue
   */
  static processNotifications() {
    this.queues.notifications.process(async (job) => {
      const { type, data } = job.data;

      switch (type) {
        case 'expense_created':
          await this.sendExpenseNotification(data);
          break;
        case 'budget_alert':
          await this.sendBudgetAlert(data);
          break;
        case 'settlement_reminder':
          await this.sendSettlementReminder(data);
          break;
      }

      return { processed: true, timestamp: new Date() };
    });

    this.setupQueueListeners(this.queues.notifications);
  }

  /**
   * Setup error handling for queue
   */
  private static setupQueueListeners(queue: Queue.Queue) {
    queue.on('failed', (job, err) => {
      console.error(`Job ${job.id} failed:`, err.message);
    });

    queue.on('completed', (job) => {
      console.log(`Job ${job.id} completed`);
    });

    queue.on('error', (err) => {
      console.error('Queue error:', err);
    });
  }

  private static async sendExpenseNotification(data: any) {
    // Implementation: Send email/push notification
    console.log('Sending expense notification:', data);
  }

  private static async sendBudgetAlert(data: any) {
    // Implementation: Alert when budget exceeded
    console.log('Sending budget alert:', data);
  }

  private static async sendSettlementReminder(data: any) {
    // Implementation: Remind to settle payments
    console.log('Sending settlement reminder:', data);
  }

  /**
   * Health check
   */
  static async getQueueStatus() {
    return {
      notifications: {
        waiting: await this.queues.notifications.getWaitingCount(),
        active: await this.queues.notifications.getActiveCount(),
        failed: await this.queues.notifications.getFailedCount(),
      },
      reports: {
        waiting: await this.queues.reports.getWaitingCount(),
        active: await this.queues.reports.getActiveCount(),
      },
    };
  }
}
```

**Usage:**
```typescript
// When creating an expense
app.post('/api/expenses', protect, async (req, res) => {
  const expense = await Expense.create({
    ...req.body,
    familyId: req.user.familyId,
    createdBy: req.user.userId,
  });

  // Queue notifications
  await QueueService.addNotification({
    type: 'expense_created',
    data: {
      expenseId: expense._id,
      familyId: expense.familyId,
      amount: expense.amount,
    }
  }, 'high');

  // Return immediately
  res.json({ success: true, data: expense });
});
```

---

### 3. Database Connection Pooling

**Configuration:**
```typescript
// backend/src/config/database.ts
import mongoose from 'mongoose';
import { config } from './env';

export async function connectDB() {
  try {
    const options = {
      maxPoolSize: 100,           // For production
      minPoolSize: 10,            // Minimum connections
      maxIdleTimeMS: 45000,       // Close idle connections
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      waitQueueTimeoutMS: 10000,
      family: 4,                  // Use IPv4
      retryWrites: true,
      w: 'majority',
      authSource: 'admin',
    };

    await mongoose.connect(config.mongodb.uri, options);

    console.log('MongoDB connected with pool size:', options.maxPoolSize);

    // Monitor connection pool
    mongoose.connection.on('connected', () => {
      console.log('Mongoose connected');
    });

    mongoose.connection.on('error', (err) => {
      console.error('Mongoose connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('Mongoose disconnected');
    });

    return mongoose.connection;
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    throw error;
  }
}

export async function disconnectDB() {
  await mongoose.disconnect();
}
```

---

### 4. Horizontal Scaling Setup

**Environment Variables:**
```env
# .env.production
NODE_ENV=production
PORT=5000
INSTANCES=3

# Database
MONGODB_URI=mongodb+srv://user:pass@cluster0.mongodb.net/expense-tracker?retryWrites=true&w=majority&maxPoolSize=100

# Cache
REDIS_URL=redis://redis-cluster:6379

# Deployment
DEPLOYMENT_ENV=kubernetes
INSTANCE_ID=${HOSTNAME}
```

**Kubernetes StatefulSet:**
```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: expense-tracker-api
  labels:
    app: expense-tracker-api
spec:
  replicas: 5
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: expense-tracker-api
  template:
    metadata:
      labels:
        app: expense-tracker-api
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "5000"
        prometheus.io/path: "/metrics"
    spec:
      containers:
      - name: api
        image: expense-tracker-api:latest
        imagePullPolicy: Always
        ports:
        - name: http
          containerPort: 5000
          protocol: TCP
        env:
        - name: NODE_ENV
          value: "production"
        - name: MONGODB_URI
          valueFrom:
            secretKeyRef:
              name: mongodb-credentials
              key: uri
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: redis-credentials
              key: url
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: jwt-secrets
              key: secret
        resources:
          requests:
            cpu: 250m
            memory: 256Mi
          limits:
            cpu: 1000m
            memory: 512Mi
        livenessProbe:
          httpGet:
            path: /health
            port: 5000
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 3
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: /health
            port: 5000
          initialDelaySeconds: 5
          periodSeconds: 5
          timeoutSeconds: 1
          failureThreshold: 2
        securityContext:
          runAsNonRoot: true
          runAsUser: 1000
          allowPrivilegeEscalation: false
---
apiVersion: v1
kind: Service
metadata:
  name: expense-tracker-api-service
  labels:
    app: expense-tracker-api
spec:
  type: LoadBalancer
  selector:
    app: expense-tracker-api
  ports:
  - name: http
    protocol: TCP
    port: 80
    targetPort: 5000
  sessionAffinity: ClientIP
  sessionAffinityConfig:
    clientIP:
      timeoutSeconds: 3600
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: expense-tracker-api-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: expense-tracker-api
  minReplicas: 3
  maxReplicas: 20
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Percent
        value: 50
        periodSeconds: 60
    scaleUp:
      stabilizationWindowSeconds: 0
      policies:
      - type: Percent
        value: 100
        periodSeconds: 15
```

---

### 5. Database Sharding

**Shard Key Selection:**
```javascript
// Shard by familyId (natural business boundary)
// Every family's data lives on one shard
// Benefits:
// - Collocates related data
// - Enables efficient family-wide queries
// - Even distribution (assuming families vary in size)

db.adminCommand({
  enableSharding: "expense-tracker"
});

db.expenses.createIndex({ familyId: 1 });
sh.shardCollection("expense-tracker.expenses", { familyId: 1 });

db.budgets.createIndex({ familyId: 1 });
sh.shardCollection("expense-tracker.budgets", { familyId: 1 });

db.transactions.createIndex({ familyId: 1 });
sh.shardCollection("expense-tracker.transactions", { familyId: 1 });
```

**Query Patterns After Sharding:**
```typescript
// GOOD: Query hits single shard (targeted query)
const expenses = await Expense.find({
  familyId: new ObjectId(familyId),  // Includes shard key
  date: { $gte: startDate, $lt: endDate }
});
// Uses index: { familyId: 1, date: 1 }

// BAD: Query scatters to all shards (inefficient)
const expenses = await Expense.find({
  category: 'Food'  // No shard key!
});
// Results in scatter-gather operation across all shards

// BETTER: Include shard key
const expenses = await Expense.find({
  familyId: new ObjectId(familyId),
  category: 'Food'
});
// Uses index: { familyId: 1, category: 1 }
```

---

### 6. Pagination Implementation

**Cursor-based Pagination (Recommended):**
```typescript
// backend/src/controllers/expenseController.ts
export async function listExpenses(req: Request, res: Response) {
  const { familyId } = req.user;
  const { limit = 50, cursor, sortBy = 'date', order = 'desc' } = req.query;

  const query = { familyId };

  // For cursor-based pagination
  if (cursor) {
    const decodedCursor = Buffer.from(cursor as string, 'base64').toString();
    const { date, id } = JSON.parse(decodedCursor);

    // Fetch one more to determine if there are more results
    const comparison = order === 'desc' ? '$lt' : '$gt';
    query.$and = [
      { $or: [
        { date: { [comparison]: new Date(date) } },
        { date: new Date(date), _id: { [comparison]: id } }
      ]}
    ];
  }

  const expenses = await Expense
    .find(query)
    .sort({ [sortBy]: order === 'asc' ? 1 : -1, _id: 1 })
    .limit(parseInt(limit as string) + 1)
    .lean();

  const hasMore = expenses.length > parseInt(limit as string);
  const data = expenses.slice(0, parseInt(limit as string));

  let nextCursor = null;
  if (hasMore && data.length > 0) {
    const lastItem = data[data.length - 1];
    nextCursor = Buffer.from(
      JSON.stringify({
        date: lastItem.date,
        id: lastItem._id
      })
    ).toString('base64');
  }

  res.json({
    success: true,
    data,
    pagination: {
      limit: parseInt(limit as string),
      hasMore,
      nextCursor
    }
  });
}
```

**Offset-based Pagination (Simpler):**
```typescript
export async function listExpensesWithOffset(req: Request, res: Response) {
  const { familyId } = req.user;
  const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
  const offset = parseInt(req.query.offset as string) || 0;

  const [data, total] = await Promise.all([
    Expense
      .find({ familyId })
      .sort({ date: -1 })
      .limit(limit)
      .skip(offset)
      .lean(),
    Expense.countDocuments({ familyId })
  ]);

  res.json({
    success: true,
    data,
    pagination: {
      limit,
      offset,
      total,
      hasMore: offset + limit < total
    }
  });
}
```

---

### 7. Monitoring & Metrics

**Prometheus Metrics Setup:**
```typescript
// backend/src/middleware/metricsMiddleware.ts
import prometheus from 'prom-client';

// Define metrics
const httpRequestDuration = new prometheus.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5]
});

const httpRequestTotal = new prometheus.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

const cacheHitRate = new prometheus.Gauge({
  name: 'cache_hit_rate',
  help: 'Cache hit rate percentage',
  labelNames: ['cache_type']
});

const databaseQueryDuration = new prometheus.Histogram({
  name: 'database_query_duration_seconds',
  help: 'Duration of database queries',
  labelNames: ['collection', 'operation'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 5]
});

// Middleware
export function metricsMiddleware(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route?.path || req.path;

    httpRequestDuration
      .labels(req.method, route, res.statusCode)
      .observe(duration);

    httpRequestTotal
      .labels(req.method, route, res.statusCode)
      .inc();
  });

  next();
}

// Metrics endpoint
app.get('/metrics', (req, res) => {
  res.set('Content-Type', prometheus.register.contentType);
  res.end(prometheus.register.metrics());
});
```

---

## Performance Targets

| Metric | Target | Current |
|--------|--------|---------|
| API P95 Latency | <100ms | 150-200ms |
| API P99 Latency | <200ms | 300-500ms |
| Cache Hit Ratio | >85% | N/A (no cache) |
| Error Rate | <0.1% | <0.5% |
| Database Query P95 | <50ms | 50-100ms |
| Memory Usage | <300MB/instance | 150-200MB |
| CPU Usage | <70% | 20-30% |

---

## Security Checklist

### Phase 1
- [ ] Enable HTTPS everywhere (already done via Vercel/Render)
- [ ] Implement HSTS header
- [ ] Add rate limiting (already done)
- [ ] Input validation with Zod (already done)
- [ ] Output encoding
- [ ] SQL injection prevention (using Mongoose)
- [ ] XSS prevention
- [ ] CSRF protection

### Phase 2
- [ ] OAuth2/OIDC integration
- [ ] API key management
- [ ] Secrets rotation
- [ ] TLS 1.3+
- [ ] Certificate pinning
- [ ] API rate limiting by tier

### Phase 3
- [ ] WAF (Web Application Firewall)
- [ ] SAML support
- [ ] SSO integration
- [ ] Security headers audit
- [ ] Penetration testing

---

## Troubleshooting Guide

### High Database Latency
```javascript
// Check slow query log
db.setProfilingLevel(1, { slowms: 100 })
db.system.profile.find().pretty()

// Analyze query execution
db.expenses.find({familyId: ..., date: {...}}).explain("executionStats")

// Solutions:
// 1. Add index if missing
// 2. Use projection to select only needed fields
// 3. Use aggregation pipeline for complex queries
```

### Low Cache Hit Ratio
```typescript
// Debug cache misses
const debugCache = async (key: string) => {
  console.log(`Cache lookup: ${key}`);
  const value = await cacheService.get(key);
  console.log(`Result: ${value ? 'HIT' : 'MISS'}`);
  return value;
};

// Solutions:
// 1. Increase TTL for frequently accessed data
// 2. Pre-populate cache on startup
// 3. Use cache warming strategy
// 4. Review cache key patterns
```

### Queue Processing Delays
```typescript
// Monitor queue health
const status = await QueueService.getQueueStatus();
console.log('Queue status:', status);

// Solutions:
// 1. Increase number of processors
// 2. Reduce job complexity
// 3. Increase Redis memory
// 4. Split jobs into smaller units
```

---

**Last Updated**: August 31, 2026
**Version**: 1.0
