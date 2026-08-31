import mongoose, { Schema, Document } from 'mongoose';

export interface IExpenseDoc extends Document {
  familyId: mongoose.Types.ObjectId;
  description: string;
  amount: number;
  currency: string;
  category: string;
  categoryId?: mongoose.Types.ObjectId;
  tags: string[];
  paidBy: mongoose.Types.ObjectId;
  date: Date;
  splits: Array<{ userId: mongoose.Types.ObjectId; amount: number; status: string }>;
  isRecurring: boolean;
  recurrencePattern?: string;
  parentExpenseId?: mongoose.Types.ObjectId;
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
  categoryId: { type: Schema.Types.ObjectId, ref: 'Category' },
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
  parentExpenseId: { type: Schema.Types.ObjectId, ref: 'Expense' },
  receipt: {
    url: String,
    uploadedAt: Date,
  },
  paymentMethod: String,
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// OPTIMIZATION: Strategic compound indexes for common queries
expenseSchema.index({ familyId: 1, date: -1 }); // Primary query: get expenses by family, sorted by date
expenseSchema.index({ familyId: 1, category: 1, date: -1 }); // Filter by category
expenseSchema.index({ familyId: 1, categoryId: 1, date: -1 }); // Filter by categoryId
expenseSchema.index({ familyId: 1, paidBy: 1, date: -1 }); // Spender comparison queries
expenseSchema.index({ familyId: 1, createdBy: 1, date: -1 }); // User's own expenses
expenseSchema.index({ familyId: 1, date: 1 }); // Range queries on date
expenseSchema.index({ paidBy: 1 }); // Direct lookup
expenseSchema.index({ createdBy: 1 }); // Direct lookup
expenseSchema.index({ categoryId: 1 }); // Direct lookup
expenseSchema.index({ category: 1 }); // Direct lookup
expenseSchema.index({ familyId: 1, isRecurring: 1, date: -1 }); // Recurring expense queries
expenseSchema.index({ familyId: 1, tags: 1, date: -1 }); // Tag filtering

export const Expense = mongoose.model<IExpenseDoc>('Expense', expenseSchema);
