import mongoose, { Schema, Document } from 'mongoose';

export interface IExpenseDoc extends Document {
  familyId: mongoose.Types.ObjectId;
  description: string;
  amount: number;
  currency: string;
  category: string;
  tags: string[];
  paidBy: mongoose.Types.ObjectId;
  date: Date;
  splits: Array<{ userId: mongoose.Types.ObjectId; amount: number; status: string }>;
  isRecurring: boolean;
  recurrencePattern?: string;
  receipt?: { url: string; uploadedAt: Date };
  paymentMethod: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const expenseSchema = new Schema<IExpenseDoc>({
  familyId: { type: Schema.Types.ObjectId, ref: 'Family', required: true },
  description: { type: String, required: true },
  amount: { type: Number, required: true, min: 0 },
  currency: { type: String, default: 'INR' },
  category: { type: String, required: true },
  tags: [String],
  paidBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, required: true },
  splits: [{
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    amount: Number,
    status: { type: String, enum: ['pending', 'settled'], default: 'pending' },
  }],
  isRecurring: { type: Boolean, default: false },
  recurrencePattern: String,
  receipt: {
    url: String,
    uploadedAt: Date,
  },
  paymentMethod: String,
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

expenseSchema.index({ familyId: 1, date: -1 });
expenseSchema.index({ paidBy: 1 });
expenseSchema.index({ category: 1 });

export const Expense = mongoose.model<IExpenseDoc>('Expense', expenseSchema);
