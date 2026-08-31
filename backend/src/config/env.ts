import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5000'),
  nodeEnv: process.env.NODE_ENV || 'development',
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/expense-tracker',
    testUri: process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/expense-tracker-test',
    // SCALABILITY: connection pool sizing. Defaults are tuned for a single
    // small-to-medium instance; raise via env when running under real load
    // (e.g. maxPoolSize=100+ per instance once you've measured actual
    // concurrent query counts - bigger isn't automatically better, it just
    // shifts the bottleneck to MongoDB's own connection limit).
    maxPoolSize: parseInt(process.env.MONGO_MAX_POOL_SIZE || '50', 10),
    minPoolSize: parseInt(process.env.MONGO_MIN_POOL_SIZE || '5', 10),
    serverSelectionTimeoutMS: parseInt(process.env.MONGO_SERVER_SELECTION_TIMEOUT_MS || '10000', 10),
    socketTimeoutMS: parseInt(process.env.MONGO_SOCKET_TIMEOUT_MS || '45000', 10),
    maxIdleTimeMS: parseInt(process.env.MONGO_MAX_IDLE_TIME_MS || '30000', 10),
  },
  redis: {
    url: process.env.REDIS_URL || '',
  },
  // Body parser limit - kept at the historical 10mb default so this is a
  // zero-behavior-change knob; tighten it per environment via env var
  // (e.g. 1mb is plenty for this API - no endpoint accepts file uploads
  // through the JSON body today, receipts are stored as a URL string).
  bodyLimit: process.env.BODY_LIMIT || '10mb',
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret-key-change-in-production',
    accessExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
  },
  frontend: {
    url: process.env.FRONTEND_URL || 'http://localhost:5173',
  },
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880'),
    uploadDir: process.env.UPLOAD_DIR || 'uploads',
  },
};

if (!config.jwt.secret || config.jwt.secret === 'dev-secret-key-change-in-production') {
  if (config.nodeEnv === 'production') {
    throw new Error('JWT_SECRET must be set in production');
  }
}
