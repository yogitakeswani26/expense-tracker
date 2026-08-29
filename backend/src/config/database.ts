import mongoose from 'mongoose';
import { config } from './env';

export const connectDB = async () => {
  try {
    const uri = config.nodeEnv === 'test' ? config.mongodb.testUri : config.mongodb.uri;
    await mongoose.connect(uri);
    console.log('✅ MongoDB connected');
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
