import app from './app';
import { config } from './config/env';
import { connectDB } from './config/database';
import { seedDemoUser } from './utils/seed';
import { seedCategories } from './seeds/categories.seed';

const startServer = async () => {
  try {
    console.log('🚀 Starting server...');

    // Connect to MongoDB
    console.log('📡 Connecting to database...');
    await connectDB();
    console.log('✅ Database connected');

    // Skip seeding for now - causes issues
    console.log('⏭️ Skipping seeding (will add back later)');

    // Start Express server
    const server = app.listen(config.port, () => {
      console.log(`🚀 Server running on port ${config.port}`);
      console.log(`📁 Environment: ${config.nodeEnv}`);
      console.log(`✅ Ready to accept requests`);
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
