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
    const query: any = { familyId };

    if (filters.category) query.category = filters.category;
    if (filters.tag) query.tags = { $in: [filters.tag] };
    if (filters.startDate || filters.endDate) {
      query.date = {};
      if (filters.startDate) query.date.$gte = new Date(filters.startDate);
      if (filters.endDate) query.date.$lte = new Date(filters.endDate);
    }
    if (filters.minAmount) query.amount = { ...query.amount, $gte: filters.minAmount };
    if (filters.maxAmount) query.amount = { ...query.amount, $lte: filters.maxAmount };

    // VALIDATION: Ensure page and limit are valid positive integers
    let page = parseInt(filters.page as string) || 1;
    let limit = parseInt(filters.limit as string) || 20;

    // Constraints to prevent DoS
    page = Math.max(1, page);
    limit = Math.min(100, Math.max(1, limit)); // Max 100 items per page

    const skip = (page - 1) * limit;

    const expenses = await Expense.find(query)
      .populate('paidBy', 'name email avatar')
      .populate('splits.userId', 'name email')
      .populate('createdBy', 'name email')
      .populate('categoryId', 'name icon color')
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Expense.countDocuments(query);

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
    const customCategories = await Category.find({ familyId }).limit(limit).skip(skip);

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

    const total = await Category.countDocuments({ familyId });
    return {
      categories: allCategories.slice(skip, skip + limit),
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
