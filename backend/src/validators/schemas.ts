/**
 * Consolidated Zod validation schemas - one file documenting the expected
 * request shape of every endpoint in the API.
 *
 * Two validation layers already exist in this codebase and are kept as-is
 * here (not duplicated/overridden) because they are proven to match what
 * the frontend actually sends:
 *   - `utils/validators.ts` - used inline by authService/expenseService for
 *     signup/login/expense create+update.
 *   - Inline schemas inside `services/budgetService.ts`.
 *
 * This file adds schemas for the endpoints that previously only had ad-hoc
 * manual checks (or none) at the route layer - families, analytics query
 * params, export query params, and the new cursor-feed endpoint - and
 * re-exports the existing ones so route files have a single import surface
 * going forward:
 *
 *   import { schemas } from '../validators/schemas';
 *   router.post('/', validateBody(schemas.createFamily), handler);
 *
 * Every schema here was written by reading the actual route/service code
 * that consumes the body, so wiring `validateBody`/`validateQuery`
 * (middleware/inputValidator.ts) with these schemas is a pure hardening
 * change for already-valid requests - malformed/malicious ones now get a
 * structured 400 instead of an ad-hoc check, a raw Mongoose CastError, or
 * (worst case) silently-dropped fields.
 */
import { z } from 'zod';
import { Types } from 'mongoose';
import {
  signupSchema,
  loginSchema,
  updateProfileSchema,
  createExpenseSchema,
  updateExpenseSchema,
  updateFamilySchema,
  expenseFiltersSchema,
} from '../utils/validators';

export const objectId = z.string().refine((v) => Types.ObjectId.isValid(v), 'Invalid ID format');

// ============================================================================
// AUTH (re-exported - already enforced in authService, kept identical here)
// ============================================================================
export { signupSchema, loginSchema, updateProfileSchema };

// ============================================================================
// EXPENSES (re-exported - already enforced in expenseService)
// ============================================================================
export { createExpenseSchema, updateExpenseSchema, expenseFiltersSchema };

/** GET /api/expenses/:familyId/feed - cursor pagination query params */
export const expenseFeedQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  category: z.string().max(100).optional(),
  tag: z.string().max(100).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

// ============================================================================
// FAMILIES (new - route previously had only manual ad-hoc checks)
// ============================================================================
export const createFamilySchema = z.object({
  name: z.string().trim().min(1, 'Family name is required').max(100, 'Family name too long'),
  currency: z.string().length(3, 'Currency must be a 3-letter ISO code').toUpperCase().optional(),
  timezone: z.string().max(64).optional(),
});

// `updateFamily` re-exported from utils/validators.ts (name/currency/timezone/avatar,
// all optional - matches the whitelist the route+service already intend to allow)
export { updateFamilySchema };

export const addFamilyMemberSchema = z
  .object({
    email: z.string().email('Invalid email').optional(),
    userId: objectId.optional(),
    role: z.enum(['member', 'viewer']).default('member'),
  })
  .refine((data) => !!data.email || !!data.userId, {
    message: 'Either email or userId is required',
    path: ['email'],
  });

export const updateMemberRoleSchema = z.object({
  role: z.enum(['owner', 'member', 'viewer']),
});

// ============================================================================
// BUDGETS (re-implemented here to match services/budgetService.ts's inline
// schema exactly - that file keeps its own copy as the source of truth for
// the service layer; this is the route-layer mirror for early rejection)
// ============================================================================
export const createBudgetSchema = z.object({
  category: z.string().min(1, 'Category is required').max(100, 'Category name too long'),
  limit: z.coerce.number().positive('Budget limit must be greater than 0').max(100000000),
  period: z.enum(['monthly', 'yearly']).default('monthly'),
  alertThreshold: z.coerce.number().min(1).max(100).default(80),
});
export const updateBudgetSchema = createBudgetSchema.partial();

// ============================================================================
// ANALYTICS (query params)
// ============================================================================
export const analyticsTrendsQuerySchema = z.object({
  months: z.coerce.number().int().min(1).max(120).default(12),
});

export const analyticsComparisonQuerySchema = z
  .object({
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
  })
  .refine((d) => !d.startDate || !d.endDate || d.startDate < d.endDate, {
    message: 'startDate must be before endDate',
    path: ['startDate'],
  });

// ============================================================================
// EXPORT (query params)
// ============================================================================
export const exportRangeQuerySchema = z
  .object({
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
  })
  .refine((d) => !d.startDate || !d.endDate || d.startDate < d.endDate, {
    message: 'startDate must be before endDate',
    path: ['startDate'],
  });

export const monthlyReportQuerySchema = z.object({
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(1900).max(2100),
});

export const yearlyReportQuerySchema = z.object({
  year: z.coerce.number().int().min(1900).max(2100),
});

/** Convenience bundle for `import { schemas } from '.../validators/schemas'`. */
export const schemas = {
  signup: signupSchema,
  login: loginSchema,
  updateProfile: updateProfileSchema,
  createExpense: createExpenseSchema,
  updateExpense: updateExpenseSchema,
  expenseFilters: expenseFiltersSchema,
  expenseFeedQuery: expenseFeedQuerySchema,
  createFamily: createFamilySchema,
  updateFamily: updateFamilySchema,
  addFamilyMember: addFamilyMemberSchema,
  updateMemberRole: updateMemberRoleSchema,
  createBudget: createBudgetSchema,
  updateBudget: updateBudgetSchema,
  analyticsTrendsQuery: analyticsTrendsQuerySchema,
  analyticsComparisonQuery: analyticsComparisonQuerySchema,
  exportRangeQuery: exportRangeQuerySchema,
  monthlyReportQuery: monthlyReportQuerySchema,
  yearlyReportQuery: yearlyReportQuerySchema,
};
