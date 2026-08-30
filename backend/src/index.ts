import app from './app';
import { config } from './config/env';
import { connectDB } from './config/database';
import { seedDemoUser } from './utils/seed';

const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Seed demo user if needed
    await seedDemoUser();

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
