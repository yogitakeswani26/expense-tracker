import { Expense } from '../models/Expense';
import { Budget } from '../models/Budget';
import { Family } from '../models/Family';
import { AppError } from '../middleware/errorHandler';
import mongoose from 'mongoose';

export class AnalyticsService {
  // ISSUE #4: Add userId parameter and verify authorization
  async getDashboardSummary(familyId: string, userId: string) {
    // Verify user is a family member
    const family = await Family.findById(familyId);
    if (!family) {
      throw new AppError('FAMILY_NOT_FOUND', 'Family not found', 404);
    }

    // Ensure consistent string conversion (Issue #3)
    const isMember = family.members.some(m => m.userId.toString() === userId);
    if (!isMember) {
      throw new AppError('UNAUTHORIZED', 'User is not a family member', 403);
    }

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    // OPTIMIZATION: Use single aggregation query with $facet to get both this month and last month data
    const results = await Expense.aggregate([
      {
        $facet: {
          thisMonth: [
            {
              $match: {
                familyId: new mongoose.Types.ObjectId(familyId),
                date: { $gte: monthStart, $lte: monthEnd },
              },
            },
            {
              $group: {
                _id: null,
                totalSpent: { $sum: '$amount' },
                transactionCount: { $sum: 1 },
              },
            },
          ],
          lastMonth: [
            {
              $match: {
                familyId: new mongoose.Types.ObjectId(familyId),
                date: { $gte: lastMonthStart, $lte: lastMonthEnd },
              },
            },
            {
              $group: {
                _id: null,
                totalSpent: { $sum: '$amount' },
              },
            },
          ],
          categoryBreakdown: [
            {
              $match: {
                familyId: new mongoose.Types.ObjectId(familyId),
                date: { $gte: monthStart, $lte: monthEnd },
              },
            },
            {
              $group: {
                _id: '$category',
                total: { $sum: '$amount' },
                count: { $sum: 1 },
              },
            },
            {
              $group: {
                _id: null,
                totalAmount: { $sum: '$total' },
                categories: { $push: { category: '$_id', total: '$total', count: '$count' } },
              },
            },
          ],
        },
      },
    ]);

    const thisMonth = results[0].thisMonth[0] || { totalSpent: 0, transactionCount: 0 };
    const lastMonth = results[0].lastMonth[0] || { totalSpent: 0 };
    const categoryData = results[0].categoryBreakdown[0] || { categories: [], totalAmount: 0 };

    const totalSpent = thisMonth.totalSpent;
    const transactionCount = thisMonth.transactionCount;
    const lastMonthTotal = lastMonth.totalSpent;
    const daysInMonth = monthEnd.getDate();
    const averageDaily = totalSpent / daysInMonth;

    // Calculate category breakdown with percentage
    const categoryBreakdown = categoryData.categories.map((cat: any) => ({
      category: cat.category,
      total: cat.total,
      count: cat.count,
      percentage: categoryData.totalAmount > 0 ? (cat.total / categoryData.totalAmount * 100).toFixed(2) : '0',
    }));

    return {
      totalSpent,
      averageDaily,
      comparison: lastMonthTotal > 0 ? ((totalSpent - lastMonthTotal) / lastMonthTotal * 100).toFixed(2) : '0',
      categoryBreakdown,
      transactionCount,
    };
  }

  // ISSUE #4: Add userId parameter and verify authorization
  async getCategoryBreakdown(familyId: string, userId: string, startDate: Date, endDate: Date) {
    // Verify user is a family member
    const family = await Family.findById(familyId);
    if (!family) {
      throw new AppError('FAMILY_NOT_FOUND', 'Family not found', 404);
    }

    // Ensure consistent string conversion (Issue #3)
    const isMember = family.members.some(m => m.userId.toString() === userId);
    if (!isMember) {
      throw new AppError('UNAUTHORIZED', 'User is not a family member', 403);
    }

    // OPTIMIZATION: Use single aggregation query instead of loading all documents into memory
    const results = await Expense.aggregate([
      {
        $match: {
          familyId: new mongoose.Types.ObjectId(familyId),
          date: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$total' },
          categories: { $push: { category: '$_id', total: '$total', count: '$count' } },
        },
      },
    ]);

    const result = results[0] || { categories: [], totalAmount: 0 };

    return result.categories.map((cat: any) => ({
      category: cat.category,
      total: cat.total,
      count: cat.count,
      percentage: result.totalAmount > 0 ? (cat.total / result.totalAmount * 100).toFixed(2) : '0',
    }));
  }

  // ISSUE #4: Add userId parameter and verify authorization
  async getMonthlyTrends(familyId: string, userId: string, months: number = 12) {
    // Verify user is a family member
    const family = await Family.findById(familyId);
    if (!family) {
      throw new AppError('FAMILY_NOT_FOUND', 'Family not found', 404);
    }

    // Ensure consistent string conversion (Issue #3)
    const isMember = family.members.some(m => m.userId.toString() === userId);
    if (!isMember) {
      throw new AppError('UNAUTHORIZED', 'User is not a family member', 403);
    }

    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth() - months + 1, 1);

    // OPTIMIZATION: Use single aggregation query instead of N+1 queries
    const results = await Expense.aggregate([
      {
        $match: {
          familyId: new mongoose.Types.ObjectId(familyId),
          date: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' },
          },
          total: { $sum: '$amount' },
        },
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 },
      },
    ]);

    const trends = results.map(result => {
      const date = new Date(result._id.year, result._id.month - 1);
      return {
        month: date.toLocaleString('default', { month: 'short', year: '2-digit' }),
        total: result.total,
      };
    });

    return trends;
  }

  // ISSUE #4: Add userId parameter and verify authorization
  async getBudgetStatus(familyId: string, userId: string) {
    // Verify user is a family member
    const family = await Family.findById(familyId);
    if (!family) {
      throw new AppError('FAMILY_NOT_FOUND', 'Family not found', 404);
    }

    // Ensure consistent string conversion (Issue #3)
    const isMember = family.members.some(m => m.userId.toString() === userId);
    if (!isMember) {
      throw new AppError('UNAUTHORIZED', 'User is not a family member', 403);
    }

    const budgets = await Budget.find({ familyId });
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // OPTIMIZATION: Single aggregation query to get all category spending
    const spendingByCategory = await Expense.aggregate([
      {
        $match: {
          familyId: new mongoose.Types.ObjectId(familyId),
          date: { $gte: monthStart, $lte: monthEnd },
        },
      },
      {
        $group: {
          _id: '$category',
          spent: { $sum: '$amount' },
        },
      },
    ]);

    const spendingMap = new Map(spendingByCategory.map((item: any) => [item._id, item.spent]));

    return budgets.map(budget => {
      const spent = spendingMap.get(budget.category) || 0;
      const remaining = Math.max(0, budget.limit - spent);
      const percentage = budget.limit > 0 ? (spent / budget.limit * 100).toFixed(2) : '0';

      return {
        category: budget.category,
        limit: budget.limit,
        spent,
        remaining,
        percentage: parseFloat(percentage),
        status: budget.limit === 0 ? 'invalid' : spent > budget.limit ? 'exceeded' : spent / budget.limit > 0.8 ? 'warning' : 'ok',
      };
    });
  }

  // ISSUE #4: Add userId parameter and verify authorization
  async getSpenderComparison(familyId: string, userId: string, startDate: Date, endDate: Date) {
    // Verify user is a family member
    const family = await Family.findById(familyId);
    if (!family) {
      throw new AppError('FAMILY_NOT_FOUND', 'Family not found', 404);
    }

    // Ensure consistent string conversion (Issue #3)
    const isMember = family.members.some(m => m.userId.toString() === userId);
    if (!isMember) {
      throw new AppError('UNAUTHORIZED', 'User is not a family member', 403);
    }

    // OPTIMIZATION: Use aggregation with $lookup instead of populate and manual grouping
    const results = await Expense.aggregate([
      {
        $match: {
          familyId: new mongoose.Types.ObjectId(familyId),
          date: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: '$paidBy',
          total: { $sum: '$amount' },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userDetails',
        },
      },
      {
        $unwind: {
          path: '$userDetails',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 0,
          name: { $ifNull: ['$userDetails.name', 'Unknown'] },
          total: 1,
        },
      },
      {
        $sort: { total: -1 },
      },
    ]);

    return results;
  }
}

export const analyticsService = new AnalyticsService();
