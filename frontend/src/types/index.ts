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
  category: string;
  limit: number;
  period: 'monthly' | 'yearly';
  spent: number;
  remaining: number;
  percentage: number;
  status: 'ok' | 'warning' | 'exceeded';
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
