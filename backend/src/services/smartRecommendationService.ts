/**
 * smartRecommendationService.ts
 * ---------------------------------------------------------------------------
 * FEATURE 3: Smart Recommendations
 *  - suggestCategoryBudgets  : data-driven budget limits per category
 *  - predictNextMonthSpending: per-category + total spend forecast
 *  - getCategoryInsights     : trend, share-of-budget, frequency per category
 *  - detectAnomalies         : z-score based unusual-expense + spend-spike detection
 *  - generateSmartDigest     : bundles all of the above for a dashboard/report
 */

import mongoose from 'mongoose';
import { Expense } from '../models/Expense';
import { Budget } from '../models/Budget';
import { AppError } from '../middleware/errorHandler';
import { mean, stdDev, zScore, forecastNextValue } from '../utils/financeAlgorithms';
import { expenseOptimizationService } from './expenseOptimizationService';

export class SmartRecommendationService {
  /** Suggests a monthly budget limit per category from recent spending history. */
  async suggestCategoryBudgets(familyId: string, months = 3) {
    if (!mongoose.Types.ObjectId.isValid(familyId)) {
      throw new AppError('INVALID_ID', 'Invalid family ID format', 400);
    }
    const clampedMonths = Math.min(12, Math.max(1, months));

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

    const byCategory = new Map<string, number[]>();
    for (const row of rows) {
      if (!byCategory.has(row._id.category)) byCategory.set(row._id.category, []);
      byCategory.get(row._id.category)!.push(row.total);
    }

    const existingBudgets = await Budget.find({ familyId }).lean();
    const existingMap = new Map(existingBudgets.map((b) => [b.category, b]));

    const suggestions = Array.from(byCategory.entries())
      .map(([category, totals]) => {
        const avg = mean(totals);
        const sd = stdDev(totals);
        // Average + half a standard deviation of headroom, rounded up to a clean number.
        const suggestedLimit = Math.ceil((avg + sd * 0.5) / 50) * 50;
        const existing = existingMap.get(category);

        let recommendation: 'new' | 'increase' | 'decrease' | 'keep' = 'new';
        if (existing) {
          if (suggestedLimit > existing.limit * 1.1) recommendation = 'increase';
          else if (suggestedLimit < existing.limit * 0.8) recommendation = 'decrease';
          else recommendation = 'keep';
        }

        return {
          category,
          monthsAnalyzed: totals.length,
          averageMonthlySpend: Math.round(avg * 100) / 100,
          suggestedLimit,
          currentLimit: existing?.limit ?? null,
          recommendation,
        };
      })
      .sort((a, b) => b.averageMonthlySpend - a.averageMonthlySpend);

    return suggestions;
  }

  /** Forecasts next month's spend per category (and total) from the last N months. */
  async predictNextMonthSpending(familyId: string, months = 6) {
    if (!mongoose.Types.ObjectId.isValid(familyId)) {
      throw new AppError('INVALID_ID', 'Invalid family ID format', 400);
    }
    const clampedMonths = Math.min(24, Math.max(3, months));

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

    const predictions = Array.from(byCategory.entries())
      .map(([category, series]) => {
        const predicted = forecastNextValue(series);
        const sd = stdDev(series);
        return {
          category,
          history: series.map((v, i) => ({ month: monthKeys[i], total: Math.round(v * 100) / 100 })),
          predictedNextMonth: predicted,
          range: {
            low: Math.max(0, Math.round((predicted - sd) * 100) / 100),
            high: Math.round((predicted + sd) * 100) / 100,
          },
        };
      })
      .sort((a, b) => b.predictedNextMonth - a.predictedNextMonth);

    const totalPredicted = Math.round(predictions.reduce((s, p) => s + p.predictedNextMonth, 0) * 100) / 100;
    const nextMonthDate = new Date(end.getFullYear(), end.getMonth() + 1, 1);

    return {
      forMonth: `${nextMonthDate.getFullYear()}-${String(nextMonthDate.getMonth() + 1).padStart(2, '0')}`,
      totalPredicted,
      categories: predictions,
    };
  }

  /** Per-category insight cards: share of budget, trend, frequency, average ticket size. */
  async getCategoryInsights(familyId: string, months = 6) {
    const { categories, totalAverage, from, to } = await expenseOptimizationService.analyzeSpendingPatterns(familyId, months);

    const end = new Date();
    const start = new Date(end.getFullYear(), end.getMonth() - (months - 1), 1);
    const freq = await Expense.aggregate([
      { $match: { familyId: new mongoose.Types.ObjectId(familyId), date: { $gte: start, $lte: end } } },
      { $group: { _id: '$category', count: { $sum: 1 }, avgAmount: { $avg: '$amount' } } },
    ]);
    const freqMap = new Map(freq.map((f) => [f._id, f]));

    const insights = categories.map((c) => {
      const f = freqMap.get(c.category);
      const currentMonth = c.monthlySeries[c.monthlySeries.length - 1]?.total ?? 0;
      const prevMonth = c.monthlySeries[c.monthlySeries.length - 2]?.total ?? 0;
      const momChange = prevMonth > 0 ? Math.round(((currentMonth - prevMonth) / prevMonth) * 1000) / 10 : null;

      return {
        category: c.category,
        shareOfTotalPct: totalAverage > 0 ? Math.round((c.average / totalAverage) * 1000) / 10 : 0,
        trend: c.trend,
        trendPctPerMonth: c.trendPctPerMonth,
        monthOverMonthChangePct: momChange,
        transactionCount: f?.count ?? 0,
        avgTransactionSize: f ? Math.round(f.avgAmount * 100) / 100 : 0,
        volatility: c.volatility,
      };
    });

    return { rangeMonths: months, from, to, topCategories: insights.slice(0, 5), all: insights };
  }

  /**
   * Flags unusually large individual expenses (z-score vs. that category's
   * own history) and days where total family spend spiked well above normal.
   */
  async detectAnomalies(familyId: string, lookbackDays = 90, recentDays = 14) {
    if (!mongoose.Types.ObjectId.isValid(familyId)) {
      throw new AppError('INVALID_ID', 'Invalid family ID format', 400);
    }

    const since = new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000);
    const recentSince = new Date(Date.now() - recentDays * 24 * 60 * 60 * 1000);

    const expenses = await Expense.find({ familyId, date: { $gte: since } })
      .select('description amount category date')
      .sort({ date: 1 })
      .lean();

    const byCategory = new Map<string, number[]>();
    for (const e of expenses) {
      if (!byCategory.has(e.category)) byCategory.set(e.category, []);
      byCategory.get(e.category)!.push(e.amount);
    }
    const baseline = new Map<string, { m: number; sd: number }>();
    for (const [cat, amounts] of byCategory) {
      baseline.set(cat, { m: mean(amounts), sd: stdDev(amounts) });
    }

    const expenseAnomalies: any[] = [];
    for (const e of expenses) {
      if (e.date < recentSince) continue;
      const stats = baseline.get(e.category);
      if (!stats || stats.sd === 0) continue;

      const z = zScore(e.amount, stats.m, stats.sd);
      if (z >= 2.5) {
        expenseAnomalies.push({
          expenseId: e._id,
          description: e.description,
          category: e.category,
          amount: e.amount,
          date: e.date,
          categoryAverage: Math.round(stats.m * 100) / 100,
          zScore: Math.round(z * 100) / 100,
          severity: z >= 4 ? 'high' : z >= 3 ? 'medium' : 'low',
          message: `₹${e.amount} on "${e.description}" is well above the typical ${e.category} spend (avg ₹${Math.round(stats.m)}).`,
        });
      }
    }

    const byDay = new Map<string, number>();
    for (const e of expenses) {
      const key = e.date.toISOString().slice(0, 10);
      byDay.set(key, (byDay.get(key) || 0) + e.amount);
    }
    const dayTotals = Array.from(byDay.values());
    const dayMean = mean(dayTotals);
    const daySd = stdDev(dayTotals);

    const dailySpendSpikes: any[] = [];
    if (daySd > 0) {
      for (const [day, total] of byDay) {
        if (new Date(day) < recentSince) continue;
        const z = zScore(total, dayMean, daySd);
        if (z >= 2.5) {
          dailySpendSpikes.push({ date: day, total: Math.round(total * 100) / 100, zScore: Math.round(z * 100) / 100 });
        }
      }
    }

    return {
      expenseAnomalies: expenseAnomalies.sort((a, b) => b.zScore - a.zScore),
      dailySpendSpikes: dailySpendSpikes.sort((a, b) => b.zScore - a.zScore),
      windowDays: lookbackDays,
    };
  }

  /** One-shot payload for a "smart insights" dashboard panel. */
  async generateSmartDigest(familyId: string) {
    const [budgetSuggestions, predictions, insights, anomalies] = await Promise.all([
      this.suggestCategoryBudgets(familyId),
      this.predictNextMonthSpending(familyId),
      this.getCategoryInsights(familyId),
      this.detectAnomalies(familyId),
    ]);

    return { generatedAt: new Date(), budgetSuggestions, predictions, insights, anomalies };
  }
}

export const smartRecommendationService = new SmartRecommendationService();
