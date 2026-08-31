/**
 * expenseOptimizationService.ts
 * ---------------------------------------------------------------------------
 * FEATURE 1: Expense Optimization AI
 *  - analyzeSpendingPatterns  : per-category trend/volatility over N months
 *  - detectRecurringCandidates: finds bills/subscriptions never flagged recurring
 *  - identifySavingsOpportunities: turns patterns + recurring candidates into
 *                                  concrete, quantified savings suggestions
 *  - generateRecommendations  : ranked, user-facing recommendation feed
 */

import mongoose from 'mongoose';
import { Expense } from '../models/Expense';
import { AppError } from '../middleware/errorHandler';
import { mean, stdDev, linearRegression, detectRecurrencePattern, RecurrenceCandidate } from '../utils/financeAlgorithms';

// =============================================================================
// TYPES
// =============================================================================

export interface CategoryPattern {
  category: string;
  monthlySeries: { month: string; total: number }[];
  average: number;
  volatility: number; // coefficient of variation: higher = more erratic month-to-month spend
  trend: 'increasing' | 'decreasing' | 'stable';
  trendPctPerMonth: number;
  projectedNextMonth: number;
}

export interface SpendingPatternReport {
  rangeMonths: number;
  from: string;
  to: string;
  totalAverage: number;
  categories: CategoryPattern[];
}

export interface RecurringCandidate extends RecurrenceCandidate {
  description: string;
  category: string;
  paidBy: mongoose.Types.ObjectId | string;
  lastDate: Date;
  expenseIds: mongoose.Types.ObjectId[];
}

export interface SavingsOpportunity {
  type: 'reduce_category' | 'category_concentration' | 'unflagged_recurring' | 'subscription_audit';
  category: string;
  title: string;
  detail: string;
  estimatedMonthlySavings: number;
  estimatedAnnualSavings: number;
  confidence: number; // 0-1
  meta?: any;
}

// =============================================================================
// SERVICE
// =============================================================================

export class ExpenseOptimizationService {
  /** Builds a month-by-month spend series per category and classifies each category's trend. */
  async analyzeSpendingPatterns(familyId: string, months = 6): Promise<SpendingPatternReport> {
    if (!mongoose.Types.ObjectId.isValid(familyId)) {
      throw new AppError('INVALID_ID', 'Invalid family ID format', 400);
    }
    const clampedMonths = Math.min(24, Math.max(2, months));

    const end = new Date();
    const start = new Date(end.getFullYear(), end.getMonth() - (clampedMonths - 1), 1);

    const rows = await Expense.aggregate([
      { $match: { familyId: new mongoose.Types.ObjectId(familyId), date: { $gte: start, $lte: end } } },
      {
        $group: {
          _id: { category: '$category', year: { $year: '$date' }, month: { $month: '$date' } },
          total: { $sum: '$amount' },
        },
      },
    ]);

    const monthKeys: string[] = [];
    for (let i = clampedMonths - 1; i >= 0; i--) {
      const d = new Date(end.getFullYear(), end.getMonth() - i, 1);
      monthKeys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    }

    const byCategory = new Map<string, number[]>();
    for (const row of rows) {
      const monthKey = `${row._id.year}-${String(row._id.month).padStart(2, '0')}`;
      const idx = monthKeys.indexOf(monthKey);
      if (idx === -1) continue;
      if (!byCategory.has(row._id.category)) byCategory.set(row._id.category, new Array(clampedMonths).fill(0));
      byCategory.get(row._id.category)![idx] = row.total;
    }

    const categories: CategoryPattern[] = Array.from(byCategory.entries())
      .map(([category, series]) => {
        const avg = mean(series);
        const sd = stdDev(series, avg);
        const { slope } = linearRegression(series);
        const volatility = avg > 0 ? Math.round((sd / avg) * 100) / 100 : 0;
        const trendPct = avg > 0 ? Math.round((slope / avg) * 1000) / 10 : 0; // % of average, per month

        let trend: CategoryPattern['trend'] = 'stable';
        if (trendPct > 8) trend = 'increasing';
        else if (trendPct < -8) trend = 'decreasing';

        return {
          category,
          monthlySeries: monthKeys.map((m, i) => ({ month: m, total: Math.round(series[i] * 100) / 100 })),
          average: Math.round(avg * 100) / 100,
          volatility,
          trend,
          trendPctPerMonth: trendPct,
          projectedNextMonth: Math.max(0, Math.round((avg + slope) * 100) / 100),
        };
      })
      .sort((a, b) => b.average - a.average);

    const totalAverage = Math.round(categories.reduce((s, c) => s + c.average, 0) * 100) / 100;

    return { rangeMonths: clampedMonths, from: monthKeys[0], to: monthKeys[monthKeys.length - 1], totalAverage, categories };
  }

  /**
   * Scans expenses that were never marked `isRecurring` and looks for
   * same-payer + same-normalized-description groups with a consistent
   * interval and amount — i.e. bills/subscriptions the user forgot to flag.
   */
  async detectRecurringCandidates(familyId: string, minOccurrences = 3): Promise<RecurringCandidate[]> {
    if (!mongoose.Types.ObjectId.isValid(familyId)) {
      throw new AppError('INVALID_ID', 'Invalid family ID format', 400);
    }

    const expenses = await Expense.find({ familyId, isRecurring: false })
      .select('description amount date paidBy category')
      .sort({ date: 1 })
      .lean();

    const groups = new Map<string, typeof expenses>();
    for (const exp of expenses) {
      const normalized = exp.description
        .toLowerCase()
        .replace(/[0-9]+/g, '')
        .replace(/[^a-z\s]/g, '')
        .trim();
      if (!normalized) continue;

      const key = `${exp.paidBy}::${normalized}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(exp);
    }

    const candidates: RecurringCandidate[] = [];
    for (const group of groups.values()) {
      if (group.length < minOccurrences) continue;

      const result = detectRecurrencePattern(group.map((g) => ({ date: g.date, amount: g.amount })));
      if (!result.isRecurring) continue;

      const last = group[group.length - 1];
      candidates.push({
        ...result,
        description: last.description,
        category: last.category,
        paidBy: last.paidBy,
        lastDate: last.date,
        expenseIds: group.map((g) => g._id),
      });
    }

    return candidates.sort((a, b) => b.confidence - a.confidence);
  }

  /** Combines spending-pattern trends + recurring-charge detection into quantified savings suggestions. */
  async identifySavingsOpportunities(familyId: string): Promise<SavingsOpportunity[]> {
    const { categories, totalAverage } = await this.analyzeSpendingPatterns(familyId, 6);
    const recurring = await this.detectRecurringCandidates(familyId);

    const opportunities: SavingsOpportunity[] = [];

    for (const cat of categories) {
      // 1) Categories trending up meaningfully month-over-month
      if (cat.trend === 'increasing' && cat.average > 0) {
        const targetReduction = Math.round(cat.average * 0.15 * 100) / 100;
        opportunities.push({
          type: 'reduce_category',
          category: cat.category,
          title: `${cat.category} spending is rising`,
          detail: `${cat.category} has grown roughly ${cat.trendPctPerMonth}%/month over the last 6 months (avg ₹${cat.average}/mo). Trimming back toward baseline could save ~₹${targetReduction}/mo.`,
          estimatedMonthlySavings: targetReduction,
          estimatedAnnualSavings: Math.round(targetReduction * 12 * 100) / 100,
          confidence: Math.min(0.9, 0.5 + Math.abs(cat.trendPctPerMonth) / 100),
        });
      }

      // 2) A single category dominating the budget (rule-of-thumb concentration check)
      const share = totalAverage > 0 ? cat.average / totalAverage : 0;
      const isHousing = /rent|housing|mortgage|emi/i.test(cat.category);
      if (share > 0.35 && !isHousing) {
        const targetReduction = Math.round(cat.average * 0.1 * 100) / 100;
        opportunities.push({
          type: 'category_concentration',
          category: cat.category,
          title: `${cat.category} dominates the family budget`,
          detail: `${cat.category} accounts for ${(share * 100).toFixed(0)}% of average monthly spend. Consider a stricter budget or diversifying spend.`,
          estimatedMonthlySavings: targetReduction,
          estimatedAnnualSavings: Math.round(targetReduction * 12 * 100) / 100,
          confidence: 0.55,
        });
      }
    }

    // 3) Unflagged recurring charges — the "quiet subscription creep" case
    for (const r of recurring) {
      const monthlyEquivalent = Math.round(((r.avgAmount * 30) / Math.max(1, r.avgIntervalDays)) * 100) / 100;
      opportunities.push({
        type: 'unflagged_recurring',
        category: r.category,
        title: `Recurring charge detected: ${r.description}`,
        detail: `₹${r.avgAmount} roughly every ${Math.round(r.avgIntervalDays)} days (${r.pattern}, seen ${r.occurrences}x, ${Math.round(
          r.confidence * 100
        )}% confidence). Not marked as recurring — review whether it's still needed.`,
        estimatedMonthlySavings: monthlyEquivalent,
        estimatedAnnualSavings: Math.round(((r.avgAmount * 365) / Math.max(1, r.avgIntervalDays)) * 100) / 100,
        confidence: r.confidence,
        meta: { expenseIds: r.expenseIds, suggestedPattern: r.pattern, paidBy: r.paidBy },
      });
    }

    // 4) Aggregate "subscription audit" nudge once enough recurring charges pile up
    if (recurring.length >= 3) {
      const recurringMonthlyTotal = recurring.reduce(
        (s, r) => s + (r.avgAmount * 30) / Math.max(1, r.avgIntervalDays),
        0
      );
      opportunities.push({
        type: 'subscription_audit',
        category: 'Subscriptions',
        title: 'Multiple recurring charges found',
        detail: `${recurring.length} recurring-looking charges total ~₹${Math.round(
          recurringMonthlyTotal
        )}/month. Bundling or cancelling unused ones is usually quick, guaranteed savings.`,
        estimatedMonthlySavings: Math.round(recurringMonthlyTotal * 0.2 * 100) / 100,
        estimatedAnnualSavings: Math.round(recurringMonthlyTotal * 0.2 * 12 * 100) / 100,
        confidence: 0.5,
      });
    }

    return opportunities.sort((a, b) => b.estimatedAnnualSavings - a.estimatedAnnualSavings);
  }

  /** User-facing, ranked recommendation feed (thin wrapper adding priority tiers). */
  async generateRecommendations(familyId: string) {
    const opportunities = await this.identifySavingsOpportunities(familyId);
    return opportunities.map((o, idx) => ({
      rank: idx + 1,
      priority: o.confidence >= 0.7 ? 'high' : o.confidence >= 0.5 ? 'medium' : 'low',
      ...o,
    }));
  }
}

export const expenseOptimizationService = new ExpenseOptimizationService();
