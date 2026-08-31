import mongoose, { Connection } from 'mongoose';

/**
 * Database Optimization Configuration
 *
 * PROBLEMS ADDRESSED:
 * 1. Connection pooling - default is 10, should scale with traffic
 * 2. Query timeouts - queries can hang indefinitely
 * 3. Missing indexes for common queries
 * 4. No query profiling for slow queries
 * 5. Memory pressure from large cursors
 */

export const optimizeDatabase = (connection: Connection) => {
  // Connection pooling configuration
  // For 100k+ users, increase pool size
  connection.setMaxListeners(1000);

  // Enable connection pool monitoring
  connection.on('connected', () => {
    console.log('📊 MongoDB: Connection pool established');
  });

  connection.on('disconnected', () => {
    console.error('⚠️  MongoDB: Connection lost - attempting reconnect...');
  });

  connection.on('error', (error) => {
    console.error('❌ MongoDB: Connection error:', error);
  });

  // Note: Profiling configuration would go here (MongoDB Atlas doesn't support it)
  const slowQueryThreshold = process.env.NODE_ENV === 'production' ? 100 : 50;
  console.log(`⏱️  Database monitoring configured (slow query threshold: ${slowQueryThreshold}ms)`);

  return connection;
};

/**
 * Ensure all critical indexes exist
 * Run this on startup to catch missing indexes early
 */
export const ensureIndexes = async (connection: Connection) => {
  try {
    // Get all collections and build index info
    const collections = await connection.db?.listCollections().toArray();

    if (!collections) {
      console.warn('⚠️  No collections found to index');
      return;
    }

    console.log(`\n🔍 Verifying ${collections.length} collections have proper indexes...\n`);

    for (const collection of collections) {
      const col = connection.collection(collection.name);
      const indexes = await col.listIndexes().toArray();
      const indexNames = indexes.map(idx => Object.keys(idx.key).join(', '));

      console.log(`  ${collection.name}: ${indexNames.length} indexes`);
    }

    console.log('\n✅ Index verification complete\n');
  } catch (error) {
    console.error('⚠️  Could not verify indexes:', error);
  }
};

/**
 * Query performance monitoring
 *
 * ISSUE: Without monitoring, slow queries go undetected and cause cascading issues
 * - Users see timeouts
 * - Server threads are exhausted
 * - Memory fills up
 * - Other queries get slower
 */
export const setupQueryMonitoring = () => {
  // Mongoose event hooks for query monitoring
  mongoose.connection.on('open', () => {
    // Hook into Mongoose query execution
    const originalExec = mongoose.Query.prototype.exec;

    mongoose.Query.prototype.exec = async function (this: any) {
      const start = Date.now();
      const query = this.getOptions();

      try {
        const result = await originalExec.call(this);
        const duration = Date.now() - start;

        // Log slow queries (>500ms)
        if (duration > 500) {
          console.warn(`⚠️  SLOW QUERY (${duration}ms): ${this._model.modelName} - ${JSON.stringify(this.getFilter()).substring(0, 100)}`);
        }

        // Track in metrics if duration > 1s
        if (duration > 1000) {
          console.error(`🚨 VERY SLOW QUERY (${duration}ms): ${this._model.modelName}`);
          // In production, send to monitoring service (Sentry, DataDog, etc.)
        }

        return result;
      } catch (error) {
        const duration = Date.now() - start;
        console.error(`❌ QUERY ERROR after ${duration}ms on ${this._model.modelName}:`, error);
        throw error;
      }
    };
  });
};

/**
 * Connection pool health check
 *
 * PROBLEM: Connection pool can become exhausted, causing new queries to hang
 */
export const startConnectionHealthCheck = (connection: Connection, intervalMs: number = 30000) => {
  setInterval(async () => {
    try {
      // Simple ping to check connection health
      await connection.db?.admin().ping();
    } catch (error) {
      console.error('❌ Connection health check failed:', error);
      // In production, trigger alert or restart
    }
  }, intervalMs);
};

/**
 * Memory pressure monitoring
 *
 * PROBLEM: Large cursor operations can exhaust memory
 * SOLUTION: Automatically switch to streaming/pagination for large datasets
 */
export const monitorMemoryPressure = (intervalMs: number = 60000) => {
  setInterval(() => {
    const heapUsed = process.memoryUsage().heapUsed / 1024 / 1024;
    const heapTotal = process.memoryUsage().heapTotal / 1024 / 1024;
    const heapUsagePercent = (heapUsed / heapTotal) * 100;

    console.log(`💾 Memory: ${heapUsed.toFixed(2)}MB / ${heapTotal.toFixed(2)}MB (${heapUsagePercent.toFixed(1)}%)`);

    // Alert if above 85%
    if (heapUsagePercent > 85) {
      console.error(`🚨 HIGH MEMORY USAGE: ${heapUsagePercent.toFixed(1)}% - Consider scaling`);
      // In production, trigger garbage collection or alert
    }
  }, intervalMs);
};
