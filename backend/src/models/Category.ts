import mongoose, { Schema, Document } from 'mongoose';

export interface ICategoryDoc extends Document {
  familyId: mongoose.Types.ObjectId;
  name: string;
  icon: string;
  color: string;
  isDefault: boolean;
  createdAt: Date;
}

const categorySchema = new Schema<ICategoryDoc>({
  familyId: { type: Schema.Types.ObjectId, ref: 'Family', required: true },
  name: { type: String, required: true },
  icon: String,
  color: String,
  isDefault: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

categorySchema.index({ familyId: 1 });

export const Category = mongoose.model<ICategoryDoc>('Category', categorySchema);
