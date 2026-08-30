import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUserDoc extends Document {
  email: string;
  password: string;
  name: string;
  avatar?: string;
  currency: string;
  language: string;
  timezone: string;
  isVerified: boolean;
  familyIds: mongoose.Types.ObjectId[];
  twoFactorEnabled: boolean;
  twoFactorSecret?: string;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(password: string): Promise<boolean>;
}

const userSchema = new Schema<IUserDoc>({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
  name: {
    type: String,
    required: true,
  },
  avatar: String,
  currency: {
    type: String,
    default: 'INR',
  },
  language: {
    type: String,
    default: 'en',
  },
  timezone: {
    type: String,
    default: 'Asia/Kolkata',
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  familyIds: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Family',
    },
  ],
  twoFactorEnabled: {
    type: Boolean,
    default: false,
  },
  twoFactorSecret: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

userSchema.pre('save', async function (done) {
  if (!this.isModified('password')) return done();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    this.updatedAt = new Date();
    done();
  } catch (error) {
    done(error as Error);
  }
});

userSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
  return bcrypt.compare(password, this.password);
};

userSchema.index({ email: 1 });
userSchema.index({ familyIds: 1 });

export const User = mongoose.model<IUserDoc>('User', userSchema);
