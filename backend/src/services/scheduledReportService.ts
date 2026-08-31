/**
 * scheduledReportService.ts
 * ---------------------------------------------------------------------------
 * FEATURE 4 (Automation): Scheduled reports
 *  - generateReport          : weekly/monthly digest for one family
 *  - generateAllFamilyReports: fan-out helper for a cron/scheduler to call
 *
 * This service only *builds* report data — it does not schedule itself, so
 * importing it has zero side effects (safe in tests, safe with multiple
 * server instances). See the wiring notes at the bottom of this file for how
 * to actually trigger it on a schedule.
 */

import mongoose from 'mongoose';
import { Family } from '../models/Family';
import { Expense } from '../models/Expense';
import { AppError } from '../middleware/errorHandler';
import { expenseOptimizationService } from './expenseOptimizationService';
import { settlementService } from './settlementService';

export type ReportPeriod = 'weekly' | 'monthly';

export interface ScheduledReport {
  familyId: string;
  period: ReportPeriod;
  rangeStart: Date;
  rangeEnd: Date;
  totalSpent: number;
  topCategories: { category: string; total: number }[];
  vsPreviousPeriodPct: number | null;
  savingsOpportunities: number;
  pendingSettlements: number;
  summaryText: string;
}

export class ScheduledReportService {
  async generateReport(familyId: string, period: ReportPeriod = 'weekly'): Promise<ScheduledReport> {
    if (!mongoose.Types.ObjectId.isValid(familyId)) {
      throw new AppError('INVALID_ID', 'Invalid family ID format', 400);
    }

    const family = await Family.findById(familyId).lean();
    if (!family) {
      throw new AppError('FAMILY_NOT_FOUND', 'Family not found', 404);
    }

    const end = new Date();
    const days = period === 'weekly' ? 7 : 30;
    const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000);
    const prevStart = new Date(start.getTime() - days * 24 * 60 * 60 * 1000);

    const [current, previous] = await Promise.all([
      Expense.aggregate([
        { $match: { familyId: new mongoose.Types.ObjectId(familyId), date: { $gte: start, $lte: end } } },
        { $group: { _id: '$category', total: { $sum: '$amount' } } },
      ]),
      Expense.aggregate([
        { $match: { familyId: new mongoose.Types.ObjectId(familyId), date: { $gte: prevStart, $lt: start } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
    ]);

    const totalSpent = Math.round(current.reduce((s, c) => s + c.total, 0) * 100) / 100;
    const previousTotal = previous[0]?.total ?? 0;
    const vsPreviousPeriodPct = previousTotal > 0 ? Math.round(((totalSpent - previousTotal) / previousTotal) * 1000) / 10 : null;

    const topCategories = current
      .map((c) => ({ category: c._id, total: Math.round(c.total * 100) / 100 }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    const [opportunities, balances] = await Promise.all([
      expenseOptimizationService.identifySavingsOpportunities(familyId),
      settlementService.calculateNetBalances(familyId),
    ]);
    const pendingSettlements = Object.values(balances).filter((b) => b < -0.01).length;

    const summaryText = this.formatSummary(
      family.name,
      period,
      totalSpent,
      vsPreviousPeriodPct,
      topCategories,
      opportunities.length,
      pendingSettlements
    );

    return {
      familyId,
      period,
      rangeStart: start,
      rangeEnd: end,
      totalSpent,
      topCategories,
      vsPreviousPeriodPct,
      savingsOpportunities: opportunities.length,
      pendingSettlements,
      summaryText,
    };
  }

  private formatSummary(
    familyName: string,
    period: ReportPeriod,
    total: number,
    changePct: number | null,
    topCategories: { category: string; total: number }[],
    opportunityCount: number,
    pendingSettlements: number
  ): string {
    const periodLabel = period === 'weekly' ? 'Weekly' : 'Monthly';
    const comparisonWindow = period === 'weekly' ? 'week' : 'month';

    const lines = [
      `${periodLabel} Report — ${familyName}`,
      `Total spent: ₹${total.toFixed(2)}${changePct !== null ? ` (${changePct > 0 ? '+' : ''}${changePct}% vs previous ${comparisonWindow})` : ''}`,
      topCategories.length
        ? `Top categories: ${topCategories.map((c) => `${c.category} (₹${c.total})`).join(', ')}`
        : 'No expenses recorded in this period.',
      opportunityCount > 0
        ? `${opportunityCount} savings opportunit${opportunityCount === 1 ? 'y' : 'ies'} found — check the Insights tab.`
        : 'No new savings opportunities detected.',
      pendingSettlements > 0
        ? `${pendingSettlements} member${pendingSettlements === 1 ? '' : 's'} with outstanding balances.`
        : 'Everyone is settled up.',
    ];

    return lines.join('\n');
  }

  /** Intended to be called by a scheduler (cron / platform scheduled job) — generates a report per family. */
  async generateAllFamilyReports(period: ReportPeriod = 'weekly'): Promise<ScheduledReport[]> {
    const families = await Family.find().select('_id').lean();
    const reports: ScheduledReport[] = [];

    for (const f of families) {
      try {
        reports.push(await this.generateReport((f._id as mongoose.Types.ObjectId).toString(), period));
      } catch (error) {
        console.error(`Failed to generate ${period} report for family ${f._id}:`, error);
      }
    }

    return reports;
  }
}

export const scheduledReportService = new ScheduledReportService();

/**
 * -----------------------------------------------------------------------
 * OPTIONAL: wiring this up to actually run on a schedule
 * -----------------------------------------------------------------------
 * This file intentionally has no side effects on import. Two ways to trigger
 * it in production, pick whichever fits your deployment:
 *
 * 1) node-cron (good for a single always-on server process):
 *
 *      npm install node-cron
 *
 *      import cron from 'node-cron';
 *      import { scheduledReportService } from './services/scheduledReportService';
 *
 *      // Every Monday at 08:00 server time
 *      cron.schedule('0 8 * * 1', async () => {
 *        const reports = await scheduledReportService.generateAllFamilyReports('weekly');
 *        // fan out reports (email / push / smartNotificationService) here
 *      });
 *
 * 2) Platform cron (Render Cron Job / Vercel Cron / k8s CronJob) hitting a
 *    protected route that calls generateAllFamilyReports() once — avoids
 *    running a scheduler inside a serverless/ephemeral process. See
 *    POST /api/automation/:familyId/checks/run in automation.routes.ts for
 *    the same pattern applied to smart notifications.
 * -----------------------------------------------------------------------
 */
