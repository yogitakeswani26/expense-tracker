import { Expense } from '../models/Expense';
import { Category } from '../models/Category';
import { Budget } from '../models/Budget';
import { AppError } from '../middleware/errorHandler';
import { createExpenseSchema } from '../utils/validators';

export class ExpenseService {
  async createExpense(familyId: string, userId: string, data: any) {
    const validation = createExpenseSchema.safeParse(data);
    if (!validation.success) {
      throw new AppError('VALIDATION_ERROR', validation.error.errors[0].message, 400);
    }

    const expense = new Expense({
      familyId,
      ...validation.data,
      paidBy: userId,
      createdBy: userId,
      date: new Date(validation.data.date),
    });

    await expense.save();
    return expense.populate(['paidBy', 'splits.userId']);
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

    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const expenses = await Expense.find(query)
      .populate(['paidBy', 'splits.userId', 'createdBy'])
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Expense.countDocuments(query);

    return { expenses, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async getExpenseById(familyId: string, expenseId: string) {
    const expense = await Expense.findOne({ _id: expenseId, familyId }).populate(['paidBy', 'splits.userId']);
    if (!expense) {
      throw new AppError('EXPENSE_NOT_FOUND', 'Expense not found', 404);
    }
    return expense;
  }

  async updateExpense(familyId: string, expenseId: string, data: any) {
    const expense = await Expense.findOneAndUpdate(
      { _id: expenseId, familyId },
      { ...data, updatedAt: new Date() },
      { new: true },
    ).populate(['paidBy', 'splits.userId']);

    if (!expense) {
      throw new AppError('EXPENSE_NOT_FOUND', 'Expense not found', 404);
    }
    return expense;
  }

  async deleteExpense(familyId: string, expenseId: string) {
    const result = await Expense.findOneAndDelete({ _id: expenseId, familyId });
    if (!result) {
      throw new AppError('EXPENSE_NOT_FOUND', 'Expense not found', 404);
    }
    return { success: true };
  }

  async getCategories(familyId: string) {
    const defaultCategories = ['Food', 'Travel', 'Shopping', 'Bills', 'Entertainment', 'Healthcare', 'Utilities'];
    const customCategories = await Category.find({ familyId });

    return [
      ...defaultCategories.map(name => ({
        _id: name,
        name,
        icon: this.getCategoryIcon(name),
        color: this.getCategoryColor(name),
        isDefault: true,
      })),
      ...customCategories,
    ];
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
