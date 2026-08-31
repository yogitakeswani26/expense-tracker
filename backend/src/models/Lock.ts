import mongoose, { Schema, Document } from 'mongoose';

/**
 * Distributed Lock Model
 *
 * Used for preventing race conditions in background jobs
 * (e.g., recurring expense processing, data reconciliation)
 *
 * USAGE:
 * const lock = new Lock({
 *   key: 'recurring-expenses-daily',
 *   expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minute TTL
 * });
 * await lock.save();
 */

export interface ILockDoc extends Document {
  key: string;
  createdAt: Date;
  expiresAt: Date;
}

const lockSchema = new Schema<ILockDoc>({
  key: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expireAfterSeconds: 0 }, // Auto-delete when expired
  },
});

export const Lock = mongoose.model<ILockDoc>('Lock', lockSchema);
