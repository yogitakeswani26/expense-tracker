import { Request } from 'express';

export interface AuthPayload {
  userId: string;
  email: string;
  role: 'owner' | 'member' | 'viewer';
  familyId: string;
}

export interface AuthRequest extends Request {
  user?: AuthPayload;
  tokenPayload?: AuthPayload;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

export type UserRole = 'owner' | 'member' | 'viewer';

export interface IUser {
  _id: string;
  email: string;
  password: string;
  name: string;
  avatar?: string;
  currency: string;
  language: string;
  timezone: string;
  isVerified: boolean;
  familyIds: string[];
  twoFactorEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IFamily {
  _id: string;
  name: string;
  ownerId: string;
  members: Array<{
    userId: string;
    role: UserRole;
    joinedAt: Date;
  }>;
  currency: string;
  timezone: string;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IExpense {
  _id: string;
  familyId: string;
  description: string;
  amount: number;
  currency: string;
  category: string;
  tags: string[];
  paidBy: string;
  date: Date;
  splits: Array<{
    userId: string;
    amount: number;
    status: 'pending' | 'settled';
  }>;
  isRecurring: boolean;
  recurrencePattern?: string;
  receipt?: {
    url: string;
    uploadedAt: Date;
  };
  paymentMethod: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICategory {
  _id: string;
  familyId: string;
  name: string;
  icon: string;
  color: string;
  isDefault: boolean;
  createdAt: Date;
}

export interface IBudget {
  _id: string;
  familyId: string;
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

export interface ITransaction {
  _id: string;
  familyId: string;
  fromUser: string;
  toUser: string;
  amount: number;
  relatedExpenses: string[];
  status: 'pending' | 'settled';
  settledAt?: Date;
  createdAt: Date;
}
