export interface Expense {
  _id: string;
  description: string;
  amount: number;
  category: string;
  categoryId?: string;
  tags: string[];
  date: string;
  paidBy: { _id: string; name: string };
  splits: Array<{ userId: string; amount: number }>;
  createdAt: string;
  /** Free-text payment method captured on the backend Expense model (e.g. "Cash", "UPI"). Optional for backwards compatibility with older records. */
  paymentMethod?: string;
}

/**
 * Controlled filter state consumed by <AdvancedFilters />.
 * All numeric/date fields are kept as strings so they can be bound
 * directly to <input> elements without losing partial user input.
 */
export interface ExpenseFilters {
  startDate: string; // 'YYYY-MM-DD' or ''
  endDate: string; // 'YYYY-MM-DD' or ''
  categories: string[]; // selected category names (multi-select)
  minAmount: string; // numeric string or ''
  maxAmount: string; // numeric string or ''
  paymentMethods: string[]; // selected payment methods (multi-select)
}

export interface Family {
  _id: string;
  name: string;
  members: Array<{ userId: string; role: string; joinedAt: string }>;
  currency: string;
  timezone: string;
}

export interface Budget {
  _id: string;
  familyId: string;
  category: string;
  limit: number;
  period: 'monthly' | 'yearly';
  /** Percentage of `limit` (1-100) at which this budget starts warning the user. Defaults to 80. */
  alertThreshold: number;
  spent: number;
  remaining: number;
  percentage: number;
  status: 'ok' | 'warning' | 'exceeded';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  createdAt: string;
  updatedAt: string;
}

/** Dashboard-friendly aggregate returned by GET /budgets/:familyId/alerts */
export interface BudgetAlertsSummary {
  totalBudgets: number;
  totalLimit: number;
  totalSpent: number;
  exceededCount: number;
  warningCount: number;
  /** Budgets at or above their alert threshold, most severe first. */
  alerts: Budget[];
  budgets: Budget[];
}

export interface Category {
  _id: string;
  name: string;
  icon: string;
  color: string;
  isDefault: boolean;
}

export interface DashboardSummary {
  totalSpent: number;
  averageDaily: number;
  comparison: string;
  categoryBreakdown: Array<{
    category: string;
    total: number;
    percentage: string;
  }>;
  transactionCount: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string };
}
