import { Expense } from '../models/Expense';
import { Category } from '../models/Category';
import { AppError } from '../middleware/errorHandler';
import { createExpenseSchema } from '../utils/validators';

export class ExpenseService {
  async createExpense(familyId: string, userId: string, data: any) {
    const validation = createExpenseSchema.safeParse(data);
    if (!validation.success) {
      throw new AppError('VALIDATION_ERROR', validation.error.issues[0].message, 400);
    }

    let expenseData: any = {
      familyId,
      ...validation.data,
      paidBy: userId,
      createdBy: userId,
      date: new Date(validation.data.date),
    };

    // Handle categoryId mapping
    if (data.categoryId) {
      try {
        const category = await Category.findById(data.categoryId);
        if (category) {
          expenseData.categoryId = data.categoryId;
          expenseData.category = category.name;
        } else {
          throw new AppError('CATEGORY_NOT_FOUND', 'Category not found', 404);
        }
      } catch (error: any) {
        if (error instanceof AppError) throw error;
        throw new AppError('CATEGORY_ERROR', 'Failed to load category', 400);
      }
    } else if (!data.category) {
      // Fallback to default category if neither is provided
      expenseData.category = 'Miscellaneous';
    }

    const expense = new Expense(expenseData);
    await expense.save();
    return expense.populate([
      { path: 'paidBy', select: 'name email avatar' },
      { path: 'splits.userId', select: 'name email' },
      { path: 'categoryId', select: 'name icon color' }
    ]);
  }

  async getExpenses(familyId: string, filters: any = {}) {
    const matchStage: any = { familyId: new (require('mongoose')).Types.ObjectId(familyId) };

    if (filters.category) matchStage.category = filters.category;
    if (filters.tag) matchStage.tags = { $in: [filters.tag] };
    if (filters.startDate || filters.endDate) {
      matchStage.date = {};
      if (filters.startDate) matchStage.date.$gte = new Date(filters.startDate);
      if (filters.endDate) matchStage.date.$lte = new Date(filters.endDate);
    }
    if (filters.minAmount || filters.maxAmount) {
      matchStage.amount = {};
      if (filters.minAmount) matchStage.amount.$gte = filters.minAmount;
      if (filters.maxAmount) matchStage.amount.$lte = filters.maxAmount;
    }

    // VALIDATION: Ensure page and limit are valid positive integers
    let page = parseInt(filters.page as string) || 1;
    let limit = parseInt(filters.limit as string) || 20;

    // Constraints to prevent DoS
    page = Math.max(1, page);
    limit = Math.min(100, Math.max(1, limit)); // Max 100 items per page

    const skip = (page - 1) * limit;

    // OPTIMIZATION: Use single aggregation query with $facet for both count and expenses
    const results = await Expense.aggregate([
      {
        $facet: {
          expenses: [
            { $match: matchStage },
            { $sort: { date: -1 } },
            { $skip: skip },
            { $limit: limit },
            {
              $lookup: {
                from: 'users',
                localField: 'paidBy',
                foreignField: '_id',
                as: 'paidBy',
              },
            },
            {
              $unwind: {
                path: '$paidBy',
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $project: {
                paidBy: { name: '$paidBy.name', email: '$paidBy.email', avatar: '$paidBy.avatar', _id: '$paidBy._id' },
                'splits.userId': 1,
                createdBy: 1,
                categoryId: 1,
                description: 1,
                amount: 1,
                currency: 1,
                category: 1,
                tags: 1,
                date: 1,
                isRecurring: 1,
                paymentMethod: 1,
                receipt: 1,
                createdAt: 1,
                updatedAt: 1,
                familyId: 1,
              },
            },
          ],
          total: [
            { $match: matchStage },
            { $count: 'count' },
          ],
        },
      },
    ]);

    const expenses = results[0].expenses;
    const total = results[0].total[0]?.count || 0;

    return { expenses, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async getExpenseById(familyId: string, expenseId: string) {
    const expense = await Expense.findOne({ _id: expenseId, familyId })
      .populate('paidBy', 'name email avatar')
      .populate('splits.userId', 'name email')
      .populate('categoryId', 'name icon color');
    if (!expense) {
      throw new AppError('EXPENSE_NOT_FOUND', 'Expense not found', 404);
    }
    return expense;
  }

  async updateExpense(familyId: string, expenseId: string, userId: string, data: any) {
    let updateData: any = { ...data, updatedAt: new Date() };

    // SECURITY: Verify user is the expense creator
    const expense = await Expense.findOne({ _id: expenseId, familyId });
    if (!expense) {
      throw new AppError('EXPENSE_NOT_FOUND', 'Expense not found', 404);
    }

    if (expense.createdBy.toString() !== userId) {
      throw new AppError('UNAUTHORIZED', 'Only the expense creator can update this expense', 403);
    }

    // Handle categoryId mapping
    if (data.categoryId) {
      try {
        const category = await Category.findById(data.categoryId);
        if (category) {
          updateData.categoryId = data.categoryId;
          updateData.category = category.name;
        } else {
          throw new AppError('CATEGORY_NOT_FOUND', 'Category not found', 404);
        }
      } catch (error: any) {
        if (error instanceof AppError) throw error;
        throw new AppError('CATEGORY_ERROR', 'Failed to load category', 400);
      }
    }

    const updatedExpense = await Expense.findOneAndUpdate(
      { _id: expenseId, familyId },
      updateData,
      { new: true },
    )
      .populate('paidBy', 'name email avatar')
      .populate('splits.userId', 'name email')
      .populate('categoryId', 'name icon color');

    return updatedExpense;
  }

  async deleteExpense(familyId: string, expenseId: string, userId: string) {
    const expense = await Expense.findOne({ _id: expenseId, familyId });
    if (!expense) {
      throw new AppError('EXPENSE_NOT_FOUND', 'Expense not found', 404);
    }

    // SECURITY: Verify user is the expense creator
    if (expense.createdBy.toString() !== userId) {
      throw new AppError('UNAUTHORIZED', 'Only the expense creator can delete this expense', 403);
    }

    const result = await Expense.findOneAndDelete({ _id: expenseId, familyId });
    return { success: true };
  }

  async getCategories(familyId: string, limit: number = 100, skip: number = 0) {
    const defaultCategories = ['Food', 'Travel', 'Shopping', 'Bills', 'Entertainment', 'Healthcare', 'Utilities'];

    // OPTIMIZATION: Use single aggregation query instead of separate count and find
    const results = await Category.aggregate([
      {
        $match: { familyId: new (require('mongoose')).Types.ObjectId(familyId) }
      },
      {
        $facet: {
          customCategories: [
            { $skip: skip },
            { $limit: limit },
          ],
          total: [
            { $count: 'count' },
          ],
        },
      },
    ]);

    const customCategories = results[0].customCategories;
    const total = results[0].total[0]?.count || 0;

    const allCategories = [
      ...defaultCategories.map(name => ({
        _id: name,
        name,
        icon: this.getCategoryIcon(name),
        color: this.getCategoryColor(name),
        isDefault: true,
      })),
      ...customCategories,
    ];

    return {
      categories: allCategories,
      total: defaultCategories.length + total,
      limit,
      skip,
    };
  }

  private getCategoryIcon(category: string): string {
    const icons: any = {
      Food: '🍔',
      Travel: '✈️',
      Shopping: '🛍️',
      Bills: '📄',
      Entertainment: '🎬',
      Healthcare: '🏥',
      Utilities: '💡',
    };
    return icons[category] || '📌';
  }

  private getCategoryColor(category: string): string {
    const colors: any = {
      Food: '#FF6B6B',
      Travel: '#4ECDC4',
      Shopping: '#FFE66D',
      Bills: '#95E1D3',
      Entertainment: '#C7CEEA',
      Healthcare: '#B19CD9',
      Utilities: '#FF8B94',
    };
    return colors[category] || '#999999';
  }
}

export const expenseService = new ExpenseService();
