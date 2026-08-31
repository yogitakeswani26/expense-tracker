import mongoose from 'mongoose';
import { config } from './env';
import { optimizeDatabase, ensureIndexes, startConnectionHealthCheck } from './databaseOptimization';

export const connectDB = async () => {
  try {
    const uri = config.nodeEnv === 'test' ? config.mongodb.testUri : config.mongodb.uri;

    // SCALABILITY: explicit connection pool + timeout tuning (see config/env.ts
    // for the env vars). Mongoose's own defaults (maxPoolSize: 100,
    // no server selection timeout override) are fine for prototyping but
    // undersized/unbounded for a production deployment where a stuck query
    // should fail fast instead of holding a pool slot indefinitely.
    await mongoose.connect(uri, {
      maxPoolSize: config.mongodb.maxPoolSize,
      minPoolSize: config.mongodb.minPoolSize,
      serverSelectionTimeoutMS: config.mongodb.serverSelectionTimeoutMS,
      socketTimeoutMS: config.mongodb.socketTimeoutMS,
      maxIdleTimeMS: config.mongodb.maxIdleTimeMS,
      retryWrites: true,
      family: 4, // skip the IPv6-then-IPv4 fallback dance on every DNS lookup
    });
    console.log(
      `✅ MongoDB connected (pool: ${config.mongodb.minPoolSize}-${config.mongodb.maxPoolSize})`,
    );

    optimizeDatabase(mongoose.connection);
    startConnectionHealthCheck(mongoose.connection);
    if (config.nodeEnv !== 'test') {
      await ensureIndexes(mongoose.connection);
    }
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
};

export const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    console.log('✅ MongoDB disconnected');
  } catch (error) {
    console.error('❌ MongoDB disconnection failed:', error);
  }
};
