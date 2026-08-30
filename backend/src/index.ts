import app from './app';
import { config } from './config/env';
import { connectDB } from './config/database';
import { seedDemoUser } from './utils/seed';
import { seedCategories } from './seeds/categories.seed';

const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    console.log('✅ Database connected');

    // Seed demo user if needed
    try {
      await seedDemoUser();
    } catch (error) {
      console.error('⚠️ Demo user seeding error:', error);
    }

    // Seed categories
    try {
      await seedCategories();
    } catch (error) {
      console.error('⚠️ Categories seeding error:', error);
    }

    // Start Express server
    app.listen(config.port, () => {
      console.log(`🚀 Server running on port ${config.port}`);
      console.log(`📁 Environment: ${config.nodeEnv}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n⏹️  Shutting down gracefully...');
  process.exit(0);
});
