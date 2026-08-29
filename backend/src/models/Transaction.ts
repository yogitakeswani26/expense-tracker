import mongoose, { Schema, Document } from 'mongoose';

export interface ITransactionDoc extends Document {
  familyId: mongoose.Types.ObjectId;
  fromUser: mongoose.Types.ObjectId;
  toUser: mongoose.Types.ObjectId;
  amount: number;
  relatedExpenses: mongoose.Types.ObjectId[];
  status: 'pending' | 'settled';
  settledAt?: Date;
  createdAt: Date;
}

const transactionSchema = new Schema<ITransactionDoc>({
  familyId: { type: Schema.Types.ObjectId, ref: 'Family', required: true },
  fromUser: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  toUser: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true, min: 0 },
  relatedExpenses: [{ type: Schema.Types.ObjectId, ref: 'Expense' }],
  status: { type: String, enum: ['pending', 'settled'], default: 'pending' },
  settledAt: Date,
  createdAt: { type: Date, default: Date.now },
});

transactionSchema.index({ familyId: 1 });
transactionSchema.index({ fromUser: 1, toUser: 1 });

export const Transaction = mongoose.model<ITransactionDoc>('Transaction', transactionSchema);
