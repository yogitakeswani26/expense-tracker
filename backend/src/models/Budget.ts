import mongoose, { Schema, Document } from 'mongoose';

export interface IBudgetDoc extends Document {
  familyId: mongoose.Types.ObjectId;
  category: string;
  limit: number;
  period: 'monthly' | 'yearly';
  alertThreshold: number;
  spent: number;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  createdAt: Date;
  updatedAt: Date;
}

const budgetSchema = new Schema<IBudgetDoc>({
  familyId: { type: Schema.Types.ObjectId, ref: 'Family', required: true },
  category: { type: String, required: true },
  limit: { type: Number, required: true, min: 0 },
  period: { type: String, enum: ['monthly', 'yearly'], default: 'monthly' },
  alertThreshold: { type: Number, default: 80 },
  spent: { type: Number, default: 0 },
  currentPeriodStart: Date,
  currentPeriodEnd: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

budgetSchema.index({ familyId: 1 });

export const Budget = mongoose.model<IBudgetDoc>('Budget', budgetSchema);
