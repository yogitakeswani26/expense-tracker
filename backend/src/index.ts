import app from './app';
import { config } from './config/env';
import { connectDB } from './config/database';
import { seedDemoUser } from './utils/seed';
import { seedCategories } from './seeds/categories.seed';
import { startMetricsCollection, monitoringService } from './services/monitoringService';
import { monitorMemoryPressure } from './config/databaseOptimization';

const startServer = async () => {
  try {
    console.log('🚀 Starting server...');

    // Connect to MongoDB
    console.log('📡 Connecting to database...');
    await connectDB();
    console.log('✅ Database connected');

    // Seed categories
    console.log('🌱 Seeding categories...');
    try {
      await seedCategories();
      console.log('✅ Categories seeded');
    } catch (error) {
      console.log('⚠️ Categories seed failed:', error instanceof Error ? error.message : 'Unknown error');
    }

    // Start Express server
    const server = app.listen(config.port, () => {
      console.log(`🚀 Server running on port ${config.port}`);
      console.log(`📁 Environment: ${config.nodeEnv}`);
      console.log(`✅ Ready to accept requests`);

      // ============================================================================
      // SAFEGUARD INITIALIZATION - Phase 1 & 4: Monitoring & Metrics
      // ============================================================================

      // Start metrics collection (records system health every minute)
      console.log('📊 Starting metrics collection...');
      startMetricsCollection(
        parseInt(process.env.METRICS_COLLECTION_INTERVAL || '60000', 10)
      );

      // Start memory pressure monitoring (every minute)
      console.log('💾 Starting memory pressure monitoring...');
      monitorMemoryPressure(
        parseInt(process.env.MEMORY_CHECK_INTERVAL || '60000', 10)
      );

      console.log('✅ All safeguards initialized');
      console.log('📈 Monitor system at:');
      console.log(`   - Basic health: GET /health`);
      console.log(`   - Metrics: GET /health/metrics`);
      console.log(`   - Anomalies: GET /health/anomalies`);
      console.log(`   - Latency: GET /health/latency`);
      console.log(`   - Errors: GET /health/errors`);
      console.log(`   - Dashboard: GET /admin/dashboard`);
    });

    // Handle server errors
    server.on('error', (error) => {
      console.error('❌ Server error:', error);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    setTimeout(() => process.exit(1), 1000);
  }
};

startServer();

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n⏹️  Shutting down gracefully...');
  process.exit(0);
});
