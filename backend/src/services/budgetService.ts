import mongoose from 'mongoose';
import { z } from 'zod';
import { Budget, IBudgetDoc } from '../models/Budget';
import { Expense } from '../models/Expense';
import { Family } from '../models/Family';
import { AppError } from '../middleware/errorHandler';

// ============================================================================
// VALIDATION
// ============================================================================

const budgetCreateSchema = z.object({
  category: z.string().min(1, 'Category is required').max(100, 'Category name too long'),
  limit: z.number().positive('Budget limit must be greater than 0').max(100000000, 'Budget limit too large'),
  period: z.enum(['monthly', 'yearly']).default('monthly'),
  alertThreshold: z.number().min(1, 'Alert threshold must be at least 1%').max(100, 'Alert threshold cannot exceed 100%').default(80),
});

const budgetUpdateSchema = budgetCreateSchema.partial();

export type BudgetWithStatus = {
  _id: mongoose.Types.ObjectId;
  familyId: mongoose.Types.ObjectId;
  category: string;
  limit: number;
  period: 'monthly' | 'yearly';
  alertThreshold: number;
  spent: number;
  remaining: number;
  percentage: number;
  status: 'ok' | 'warning' | 'exceeded';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  createdAt: Date;
  updatedAt: Date;
};

// ============================================================================
// HELPERS
// ============================================================================

function coerceNumber(value: unknown): unknown {
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? value : parsed;
  }
  return value;
}

function normalizeBudgetInput(data: any) {
  return {
    ...data,
    limit: data?.limit !== undefined ? coerceNumber(data.limit) : undefined,
    alertThreshold: data?.alertThreshold !== undefined ? coerceNumber(data.alertThreshold) : undefined,
  };
}

function getPeriodRange(period: 'monthly' | 'yearly', reference: Date = new Date()) {
  if (period === 'yearly') {
    const start = new Date(reference.getFullYear(), 0, 1, 0, 0, 0, 0);
    const end = new Date(reference.getFullYear(), 11, 31, 23, 59, 59, 999);
    return { start, end };
  }
  const start = new Date(reference.getFullYear(), reference.getMonth(), 1, 0, 0, 0, 0);
  const end = new Date(reference.getFullYear(), reference.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

function computeStatus(spent: number, limit: number, alertThreshold: number): 'ok' | 'warning' | 'exceeded' {
  if (limit <= 0) return 'ok';
  const pct = (spent / limit) * 100;
  if (pct >= 100) return 'exceeded';
  if (pct >= alertThreshold) return 'warning';
  return 'ok';
}

async function assertFamilyMembership(familyId: string, userId: string) {
  if (!mongoose.Types.ObjectId.isValid(familyId)) {
    throw new AppError('INVALID_ID', 'Invalid family ID format', 400);
  }

  const family = await Family.findById(familyId);
  if (!family) {
    throw new AppError('FAMILY_NOT_FOUND', 'Family not found', 404);
  }

  const isMember = family.members.some(m => m.userId.toString() === userId);
  if (!isMember) {
    throw new AppError('FORBIDDEN', 'You are not a member of this family', 403);
  }

  return family;
}

function validateBudgetId(budgetId: string) {
  if (!mongoose.Types.ObjectId.isValid(budgetId)) {
    throw new AppError('INVALID_ID', 'Invalid budget ID format', 400);
  }
}

// ============================================================================
// SERVICE
// ============================================================================

export class BudgetService {
  /**
   * Create a new budget for a family/category/period.
   * Prevents duplicate active budgets for the same category + period.
   */
  async createBudget(familyId: string, userId: string, data: any): Promise<BudgetWithStatus> {
    await assertFamilyMembership(familyId, userId);

    const validation = budgetCreateSchema.safeParse(normalizeBudgetInput(data));
    if (!validation.success) {
      throw new AppError('VALIDATION_ERROR', validation.error.issues[0].message, 400);
    }

    const { category, limit, period, alertThreshold } = validation.data;

    const existing = await Budget.findOne({ familyId, category, period });
    if (existing) {
      throw new AppError(
        'DUPLICATE_BUDGET',
        `A ${period} budget for "${category}" already exists`,
        409,
      );
    }

    const { start, end } = getPeriodRange(period);

    const budget = await Budget.create({
      familyId,
      category,
      limit,
      period,
      alertThreshold,
      spent: 0,
      currentPeriodStart: start,
      currentPeriodEnd: end,
    });

    return this.attachStatus(budget);
  }

  /** List all budgets for a family with live spend/status computed from expenses. */
  async getBudgets(familyId: string, userId: string): Promise<BudgetWithStatus[]> {
    await assertFamilyMembership(familyId, userId);

    const budgets = await Budget.find({ familyId }).sort({ createdAt: -1 });
    return Promise.all(budgets.map(budget => this.attachStatus(budget)));
  }

  /** Fetch a single budget with live spend/status. */
  async getBudgetById(familyId: string, userId: string, budgetId: string): Promise<BudgetWithStatus> {
    await assertFamilyMembership(familyId, userId);
    validateBudgetId(budgetId);

    const budget = await Budget.findOne({ _id: budgetId, familyId });
    if (!budget) {
      throw new AppError('BUDGET_NOT_FOUND', 'Budget not found', 404);
    }

    return this.attachStatus(budget);
  }

  /** Update an existing budget (partial update). */
  async updateBudget(familyId: string, userId: string, budgetId: string, data: any): Promise<BudgetWithStatus> {
    await assertFamilyMembership(familyId, userId);
    validateBudgetId(budgetId);

    const budget = await Budget.findOne({ _id: budgetId, familyId });
    if (!budget) {
      throw new AppError('BUDGET_NOT_FOUND', 'Budget not found', 404);
    }

    const validation = budgetUpdateSchema.safeParse(normalizeBudgetInput(data));
    if (!validation.success) {
      throw new AppError('VALIDATION_ERROR', validation.error.issues[0].message, 400);
    }

    const nextCategory = validation.data.category ?? budget.category;
    const nextPeriod = validation.data.period ?? budget.period;

    if (nextCategory !== budget.category || nextPeriod !== budget.period) {
      const duplicate = await Budget.findOne({
        familyId,
        category: nextCategory,
        period: nextPeriod,
        _id: { $ne: budget._id },
      });
      if (duplicate) {
        throw new AppError(
          'DUPLICATE_BUDGET',
          `A ${nextPeriod} budget for "${nextCategory}" already exists`,
          409,
        );
      }
    }

    if (validation.data.category !== undefined) budget.category = validation.data.category;
    if (validation.data.limit !== undefined) budget.limit = validation.data.limit;
    if (validation.data.alertThreshold !== undefined) budget.alertThreshold = validation.data.alertThreshold;

    if (validation.data.period !== undefined && validation.data.period !== budget.period) {
      budget.period = validation.data.period;
      const { start, end } = getPeriodRange(budget.period);
      budget.currentPeriodStart = start;
      budget.currentPeriodEnd = end;
    }

    budget.updatedAt = new Date();
    await budget.save();

    return this.attachStatus(budget);
  }

  /** Delete a budget. */
  async deleteBudget(familyId: string, userId: string, budgetId: string): Promise<{ success: true }> {
    await assertFamilyMembership(familyId, userId);
    validateBudgetId(budgetId);

    const budget = await Budget.findOneAndDelete({ _id: budgetId, familyId });
    if (!budget) {
      throw new AppError('BUDGET_NOT_FOUND', 'Budget not found', 404);
    }

    return { success: true };
  }

  /**
   * Lightweight summary used by the dashboard: totals + only the budgets
   * that are at/over their alert threshold, sorted by severity.
   */
  async getBudgetAlerts(familyId: string, userId: string) {
    const budgets = await this.getBudgets(familyId, userId);

    const alerts = budgets
      .filter(b => b.status !== 'ok')
      .sort((a, b) => b.percentage - a.percentage);

    return {
      totalBudgets: budgets.length,
      totalLimit: budgets.reduce((sum, b) => sum + b.limit, 0),
      totalSpent: budgets.reduce((sum, b) => sum + b.spent, 0),
      exceededCount: budgets.filter(b => b.status === 'exceeded').length,
      warningCount: budgets.filter(b => b.status === 'warning').length,
      alerts,
      budgets,
    };
  }

  /** Compute live spend for a budget document and shape the API response. */
  private async attachStatus(budget: IBudgetDoc): Promise<BudgetWithStatus> {
    const { start, end } = getPeriodRange(budget.period);

    const result = await Expense.aggregate([
      {
        $match: {
          familyId: budget.familyId,
          category: budget.category,
          date: { $gte: start, $lte: end },
        },
      },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    const spent = result[0]?.total || 0;
    const remaining = Math.max(0, budget.limit - spent);
    const percentage = budget.limit > 0 ? Math.round((spent / budget.limit) * 10000) / 100 : 0;
    const status = computeStatus(spent, budget.limit, budget.alertThreshold);

    // Keep the persisted snapshot roughly in sync for any external readers of Budget.spent
    if (budget.spent !== spent || budget.currentPeriodStart?.getTime() !== start.getTime() || budget.currentPeriodEnd?.getTime() !== end.getTime()) {
      Budget.updateOne(
        { _id: budget._id },
        { $set: { spent, currentPeriodStart: start, currentPeriodEnd: end } },
      ).catch(() => {
        /* best-effort cache sync; live values below are always authoritative */
      });
    }

    return {
      _id: budget._id,
      familyId: budget.familyId,
      category: budget.category,
      limit: budget.limit,
      period: budget.period,
      alertThreshold: budget.alertThreshold,
      spent,
      remaining,
      percentage,
      status,
      currentPeriodStart: start,
      currentPeriodEnd: end,
      createdAt: budget.createdAt,
      updatedAt: budget.updatedAt,
    };
  }
}

export const budgetService = new BudgetService();
