import mongoose, { Schema, Document } from 'mongoose';

export interface IFamilyDoc extends Document {
  name: string;
  ownerId: mongoose.Types.ObjectId;
  members: Array<{
    userId: mongoose.Types.ObjectId;
    role: 'owner' | 'member' | 'viewer';
    joinedAt: Date;
  }>;
  currency: string;
  timezone: string;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

const familySchema = new Schema<IFamilyDoc>({
  name: { type: String, required: true },
  ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  members: [{
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    role: { type: String, enum: ['owner', 'member', 'viewer'], default: 'member' },
    joinedAt: { type: Date, default: Date.now },
  }],
  currency: { type: String, default: 'INR' },
  timezone: { type: String, default: 'Asia/Kolkata' },
  avatar: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

familySchema.index({ ownerId: 1 });
familySchema.index({ 'members.userId': 1 });

export const Family = mongoose.model<IFamilyDoc>('Family', familySchema);
