import { Expense } from '../models/Expense';
import { Budget } from '../models/Budget';

export class AnalyticsService {
  async getDashboardSummary(familyId: string) {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const thisMonthExpenses = await Expense.find({
      familyId,
      date: { $gte: monthStart, $lte: monthEnd },
    });

    const totalSpent = thisMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
    const averageDaily = thisMonthExpenses.length > 0 ? totalSpent / thisMonthExpenses.length : 0;

    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    const lastMonthExpenses = await Expense.find({
      familyId,
      date: { $gte: lastMonthStart, $lte: lastMonthEnd },
    });
    const lastMonthTotal = lastMonthExpenses.reduce((sum, e) => sum + e.amount, 0);

    const categoryBreakdown = await this.getCategoryBreakdown(familyId, monthStart, monthEnd);

    return {
      totalSpent,
      averageDaily,
      comparison: lastMonthTotal > 0 ? ((totalSpent - lastMonthTotal) / lastMonthTotal * 100).toFixed(2) : 0,
      categoryBreakdown,
      transactionCount: thisMonthExpenses.length,
    };
  }

  async getCategoryBreakdown(familyId: string, startDate: Date, endDate: Date) {
    const expenses = await Expense.find({
      familyId,
      date: { $gte: startDate, $lte: endDate },
    });

    const breakdown: any = {};

    expenses.forEach(expense => {
      if (!breakdown[expense.category]) {
        breakdown[expense.category] = { total: 0, count: 0 };
      }
      breakdown[expense.category].total += expense.amount;
      breakdown[expense.category].count += 1;
    });

    return Object.entries(breakdown).map(([category, data]: any) => ({
      category,
      total: data.total,
      count: data.count,
      percentage: (data.total / expenses.reduce((sum, e) => sum + e.amount, 0) * 100).toFixed(2),
    }));
  }

  async getMonthlyTrends(familyId: string, months: number = 12) {
    const trends = [];
    const now = new Date();

    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      const expenses = await Expense.find({
        familyId,
        date: { $gte: monthStart, $lte: monthEnd },
      });

      const total = expenses.reduce((sum, e) => sum + e.amount, 0);
      trends.push({
        month: date.toLocaleString('default', { month: 'short', year: '2-digit' }),
        total,
      });
    }

    return trends;
  }

  async getBudgetStatus(familyId: string) {
    const budgets = await Budget.find({ familyId });
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    return Promise.all(
      budgets.map(async budget => {
        const expenses = await Expense.find({
          familyId,
          category: budget.category,
          date: { $gte: monthStart, $lte: monthEnd },
        });

        const spent = expenses.reduce((sum, e) => sum + e.amount, 0);
        const remaining = Math.max(0, budget.limit - spent);
        const percentage = (spent / budget.limit * 100).toFixed(2);

        return {
          category: budget.category,
          limit: budget.limit,
          spent,
          remaining,
          percentage: parseFloat(percentage),
          status: spent > budget.limit ? 'exceeded' : spent / budget.limit > 0.8 ? 'warning' : 'ok',
        };
      }),
    );
  }

  async getSpenderComparison(familyId: string, startDate: Date, endDate: Date) {
    const expenses = await Expense.find({
      familyId,
      date: { $gte: startDate, $lte: endDate },
    }).populate('paidBy');

    const spenders: any = {};

    expenses.forEach((expense: any) => {
      const spender = expense.paidBy._id.toString();
      if (!spenders[spender]) {
        spenders[spender] = { name: (expense.paidBy as any).name, total: 0 };
      }
      spenders[spender].total += expense.amount;
    });

    return Object.entries(spenders).map(([, data]: any) => data).sort((a, b) => b.total - a.total);
  }
}

export const analyticsService = new AnalyticsService();
