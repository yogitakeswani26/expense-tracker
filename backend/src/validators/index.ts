/**
 * Comprehensive Input Validation Schemas
 * All API endpoints validated with Zod
 *
 * MEDIUM FIX 3.3.1: Input Validation Framework
 * Provides 100% input validation coverage
 */

import { z } from 'zod';

// ============================================================================
// AUTH VALIDATORS
// ============================================================================

export const SignupSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string()
    .min(12, 'Password must be at least 12 characters')
    .regex(/[A-Z]/, 'Must contain uppercase letter')
    .regex(/[0-9]/, 'Must contain number')
    .regex(/[!@#$%^&*]/, 'Must contain special character (!@#$%^&*)'),
  firstName: z.string().min(2, 'First name too short'),
  lastName: z.string().min(2, 'Last name too short'),
});

export const LoginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password required'),
});

export const UpdateProfileSchema = z.object({
  firstName: z.string().min(2).optional(),
  lastName: z.string().min(2).optional(),
  currency: z.string().regex(/^[A-Z]{3}$/, 'Invalid currency code').optional(),
  timezone: z.string().optional(),
  language: z.string().optional(),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number').optional(),
});

// ============================================================================
// EXPENSE VALIDATORS
// ============================================================================

export const CreateExpenseSchema = z.object({
  familyId: z.string().min(24, 'Invalid family ID').max(24),
  description: z.string().min(1).max(500),
  amount: z.number().positive('Amount must be positive').max(999999, 'Amount too large'),
  category: z.string().min(1),
  paidBy: z.string().min(24).max(24),
  date: z.string().datetime().optional(),
  tags: z.array(z.string()).optional(),
  receipt: z.string().url().optional(),
  splits: z.array(z.object({
    userId: z.string().min(24).max(24),
    amount: z.number().positive(),
    percentage: z.number().min(0).max(100).optional(),
  })).optional(),
});

export const UpdateExpenseSchema = CreateExpenseSchema.partial();

export const ExpenseFilterSchema = z.object({
  familyId: z.string().min(24).max(24),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  category: z.string().optional(),
  paidBy: z.string().optional(),
  minAmount: z.number().nonnegative().optional(),
  maxAmount: z.number().nonnegative().optional(),
  tags: z.array(z.string()).optional(),
  page: z.number().int().nonnegative().default(1),
  limit: z.number().int().positive().max(100).default(20),
});

// ============================================================================
// FAMILY VALIDATORS
// ============================================================================

export const CreateFamilySchema = z.object({
  name: z.string().min(2).max(50),
  description: z.string().max(500).optional(),
  currency: z.string().regex(/^[A-Z]{3}$/).optional(),
});

export const UpdateFamilySchema = CreateFamilySchema.partial();

export const InviteMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(['admin', 'member']).default('member'),
});

export const UpdateMemberRoleSchema = z.object({
  role: z.enum(['admin', 'member']),
});

// ============================================================================
// RECURRING EXPENSE VALIDATORS
// ============================================================================

export const CreateRecurringExpenseSchema = z.object({
  familyId: z.string().min(24).max(24),
  description: z.string().min(1).max(500),
  amount: z.number().positive().max(999999),
  category: z.string().min(1),
  frequency: z.enum(['daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly']),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
  paidBy: z.string().min(24).max(24),
  splits: z.array(z.object({
    userId: z.string().min(24).max(24),
    percentage: z.number().min(0).max(100),
  })).optional(),
});

// ============================================================================
// SPLIT PAYMENT VALIDATORS
// ============================================================================

export const SplitPaymentSchema = z.object({
  expenses: z.array(z.object({
    expenseId: z.string().min(24).max(24),
    amount: z.number().positive(),
  })),
  splits: z.array(z.object({
    userId: z.string().min(24).max(24),
    amount: z.number().nonnegative(),
  })).refine(splits => {
    const total = splits.reduce((sum, s) => sum + s.amount, 0);
    return total > 0;
  }, 'At least one split must have amount > 0'),
});

// ============================================================================
// BUDGET VALIDATORS
// ============================================================================

export const CreateBudgetSchema = z.object({
  familyId: z.string().min(24).max(24),
  category: z.string().min(1),
  limit: z.number().positive().max(999999),
  period: z.enum(['monthly', 'quarterly', 'yearly']),
  alertThreshold: z.number().min(0).max(100).default(80),
});

// ============================================================================
// ANALYTICS VALIDATORS
// ============================================================================

export const AnalyticsQuerySchema = z.object({
  familyId: z.string().min(24).max(24),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  groupBy: z.enum(['day', 'week', 'month', 'year']).optional(),
});

// ============================================================================
// EXPORT VALIDATORS
// ============================================================================

export const ExportSchema = z.object({
  familyId: z.string().min(24).max(24),
  format: z.enum(['csv', 'json', 'html']),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  includeAnalytics: z.boolean().default(false),
});

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Validate and parse request data
 */
export function validateRequest<T>(schema: z.ZodSchema<T>, data: any): T {
  try {
    return schema.parse(data) as T;
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      throw {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request data',
        errors: (error as z.ZodError).issues.map((e: any) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      };
    }
    throw error;
  }
}

/**
 * Validate with partial schema (for updates)
 */
export function validatePartialRequest<T>(schema: z.ZodSchema<Partial<T>>, data: any): Partial<T> {
  try {
    return schema.parse(data) as Partial<T>;
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      throw {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request data',
        errors: (error as z.ZodError).issues.map((e: any) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      };
    }
    throw error;
  }
}
