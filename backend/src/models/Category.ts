import mongoose, { Schema, Document } from 'mongoose';

export interface ICategoryDoc extends Document {
  name: string;
  emoji: string;
  description?: string;
  parentId?: mongoose.Types.ObjectId | null;
  level: 1 | 2 | 3;
  order: number;
  isActive: boolean;
  isDefault?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const categorySchema = new Schema<ICategoryDoc>({
  name: { type: String, required: true, index: true },
  emoji: { type: String, required: true },
  description: String,
  parentId: { type: Schema.Types.ObjectId, ref: 'Category', default: null },
  level: { type: Number, enum: [1, 2, 3], required: true },
  order: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  isDefault: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

categorySchema.index({ parentId: 1, level: 1 });
categorySchema.index({ isActive: 1 });

export const Category = mongoose.model<ICategoryDoc>('Category', categorySchema);
