import { z } from 'zod';
import { Types } from 'mongoose';

// SECURITY: ObjectId validator to prevent invalid ID attacks
export const objectIdSchema = z.string().refine(
  (id) => Types.ObjectId.isValid(id),
  'Invalid ObjectId format'
);

export const signupSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, 'Password must contain at least one special character'),
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
  category: z.string().min(1).optional(),
  categoryId: z.string().optional(),
  tags: z.array(z.string()).optional(),
  date: z.string().or(z.date()),
  splits: z.array(z.object({
    userId: z.string(),
    amount: z.number().positive(),
  })).optional(),
  isRecurring: z.boolean().optional(),
  recurrencePattern: z.enum(['daily', 'weekly', 'monthly', 'yearly']).optional(),
  paymentMethod: z.string().optional(),
}).refine(
  (data) => data.category || data.categoryId,
  { message: 'Either category or categoryId is required', path: ['category'] }
);

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

// ISSUE #14: Add comprehensive validation schemas for all inputs
export const updateExpenseSchema = z.object({
  description: z.string().min(1).optional(),
  amount: z.number().positive().optional(),
  category: z.string().optional(),
  categoryId: z.string().optional(),
  tags: z.array(z.string()).optional(),
  date: z.string().or(z.date()).optional(),
  splits: z.array(z.object({
    userId: z.string(),
    amount: z.number().positive(),
  })).optional(),
  paymentMethod: z.string().optional(),
});

export const updateFamilySchema = z.object({
  name: z.string().min(1).optional(),
  currency: z.string().optional(),
  timezone: z.string().optional(),
  avatar: z.string().optional(),
});

export const paginationSchema = z.object({
  page: z.string().or(z.number()).optional().default('1'),
  limit: z.string().or(z.number()).optional().default('20'),
});

export const expenseFiltersSchema = z.object({
  category: z.string().optional(),
  tag: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  minAmount: z.string().or(z.number()).optional(),
  maxAmount: z.string().or(z.number()).optional(),
  page: z.string().or(z.number()).optional().default('1'),
  limit: z.string().or(z.number()).optional().default('20'),
});
