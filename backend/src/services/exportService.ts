import { Expense } from '../models/Expense';

export class ExportService {
  async exportExpensesCSV(familyId: string, startDate?: Date, endDate?: Date) {
    const query: any = { familyId };

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = startDate;
      if (endDate) query.date.$lte = endDate;
    }

    const expenses = await Expense.find(query)
      .populate('paidBy', 'name email')
      .populate('splits.userId', 'name')
      .sort({ date: -1 });

    // CSV Header
    let csv = 'Date,Description,Category,Amount (₹),Paid By,Tags,Notes\n';

    // CSV Rows
    expenses.forEach(expense => {
      const date = new Date(expense.date).toLocaleDateString('en-IN');
      const description = `"${expense.description}"`;
      const category = expense.category;
      const amount = expense.amount;
      const paidBy = (expense.paidBy as any).name || 'Unknown';
      const tags = expense.tags.join('; ');
      const notes = expense.splits?.length ? `Split among ${expense.splits.length} people` : 'Personal';

      csv += `${date},${description},${category},${amount},${paidBy},"${tags}","${notes}"\n`;
    });

    return csv;
  }

  async exportExpensesJSON(familyId: string, startDate?: Date, endDate?: Date) {
    const query: any = { familyId };

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = startDate;
      if (endDate) query.date.$lte = endDate;
    }

    const expenses = await Expense.find(query)
      .populate('paidBy', 'name email')
      .populate('splits.userId', 'name email')
      .sort({ date: -1 });

    return {
      exportDate: new Date(),
      familyId,
      totalExpenses: expenses.length,
      totalAmount: expenses.reduce((sum, e) => sum + e.amount, 0),
      expenses: expenses.map(exp => ({
        date: exp.date,
        description: exp.description,
        amount: exp.amount,
        category: exp.category,
        paidBy: (exp.paidBy as any).name,
        tags: exp.tags,
        splits: exp.splits?.map(s => ({
          person: (s.userId as any).name,
          amount: s.amount,
        })),
      })),
    };
  }

  async generateMonthlyReport(familyId: string, month: number, year: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const expenses = await Expense.find({
      familyId,
      date: { $gte: startDate, $lte: endDate },
    }).populate('paidBy', 'name');

    const categoryBreakdown: any = {};
    let totalSpent = 0;

    expenses.forEach(exp => {
      if (!categoryBreakdown[exp.category]) {
        categoryBreakdown[exp.category] = 0;
      }
      categoryBreakdown[exp.category] += exp.amount;
      totalSpent += exp.amount;
    });

    const topExpenses = expenses.sort((a, b) => b.amount - a.amount).slice(0, 5);

    return {
      month: new Date(year, month - 1).toLocaleString('default', { month: 'long', year: 'numeric' }),
      totalSpent,
      transactionCount: expenses.length,
      averageTransaction: totalSpent / (expenses.length || 1),
      categoryBreakdown,
      topExpenses: topExpenses.map(e => ({
        description: e.description,
        amount: e.amount,
        date: e.date,
        paidBy: (e.paidBy as any).name,
      })),
    };
  }

  async generateYearlyReport(familyId: string, year: number) {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31, 23, 59, 59);

    const expenses = await Expense.find({
      familyId,
      date: { $gte: startDate, $lte: endDate },
    });

    const monthlyBreakdown: any = {};
    let totalSpent = 0;

    for (let month = 0; month < 12; month++) {
      const monthStart = new Date(year, month, 1);
      const monthEnd = new Date(year, month + 1, 0, 23, 59, 59);
      const monthExpenses = expenses.filter(
        e => e.date >= monthStart && e.date <= monthEnd
      );
      const monthTotal = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
      const monthName = new Date(year, month).toLocaleString('default', { month: 'short' });
      monthlyBreakdown[monthName] = monthTotal;
      totalSpent += monthTotal;
    }

    return {
      year,
      totalSpent,
      averageMonthly: totalSpent / 12,
      transactionCount: expenses.length,
      monthlyBreakdown,
    };
  }
}

export const exportService = new ExportService();
