import { Expense } from '../models/Expense';

export class RecurringService {
  async processRecurringExpenses() {
    try {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      // Find recurring expenses that need to be created
      const recurringExpenses = await Expense.find({
        isRecurring: true,
        date: { $lte: yesterday },
      });

      for (const expense of recurringExpenses) {
        const nextDate = this.getNextDate(expense.date, expense.recurrencePattern);

        if (nextDate <= now) {
          // Create new expense
          const newExpense = new Expense({
            ...expense.toObject(),
            _id: undefined,
            date: nextDate,
          });

          await newExpense.save();
          console.log(`Created recurring expense: ${expense.description}`);
        }
      }
    } catch (error) {
      console.error('Error processing recurring expenses:', error);
    }
  }

  private getNextDate(currentDate: Date, pattern?: string): Date {
    const next = new Date(currentDate);

    switch (pattern) {
      case 'daily':
        next.setDate(next.getDate() + 1);
        break;
      case 'weekly':
        next.setDate(next.getDate() + 7);
        break;
      case 'monthly':
        next.setMonth(next.getMonth() + 1);
        break;
      case 'yearly':
        next.setFullYear(next.getFullYear() + 1);
        break;
      default:
        next.setDate(next.getDate() + 1);
    }

    return next;
  }

  async getUpcomingRecurring(familyId: string) {
    const recurringExpenses = await Expense.find({
      familyId,
      isRecurring: true,
    })
      .populate('paidBy', 'name')
      .sort({ date: 1 })
      .limit(10);

    return recurringExpenses.map(exp => ({
      _id: exp._id,
      description: exp.description,
      amount: exp.amount,
      pattern: exp.recurrencePattern,
      nextDate: this.getNextDate(exp.date, exp.recurrencePattern),
      paidBy: (exp.paidBy as any).name,
    }));
  }

  async updateRecurrencePattern(expenseId: string, pattern: string) {
    const expense = await Expense.findByIdAndUpdate(
      expenseId,
      { recurrencePattern: pattern },
      { new: true }
    );

    return expense;
  }

  async stopRecurrence(expenseId: string) {
    const expense = await Expense.findByIdAndUpdate(expenseId, { isRecurring: false }, { new: true });

    return expense;
  }
}

export const recurringService = new RecurringService();
