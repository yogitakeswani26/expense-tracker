import { z } from 'zod';

export const signupSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  avatar: z.string().optional(),
  currency: z.string().optional(),
  language: z.string().optional(),
  timezone: z.string().optional(),
});

export const createExpenseSchema = z.object({
  description: z.string().min(1, 'Description required'),
  amount: z.number().positive('Amount must be positive'),
  category: z.string().min(1),
  tags: z.array(z.string()).optional(),
  date: z.string().or(z.date()),
  splits: z.array(z.object({
    userId: z.string(),
    amount: z.number().positive(),
  })).optional(),
  isRecurring: z.boolean().optional(),
  recurrencePattern: z.enum(['daily', 'weekly', 'monthly', 'yearly']).optional(),
  paymentMethod: z.string().optional(),
});

export const createFamilySchema = z.object({
  name: z.string().min(1, 'Family name required'),
});

export const inviteMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(['owner', 'member', 'viewer']).optional(),
});

export const createBudgetSchema = z.object({
  category: z.string(),
  limit: z.number().positive(),
  period: z.enum(['monthly', 'yearly']),
  alertThreshold: z.number().min(0).max(100).optional(),
});
