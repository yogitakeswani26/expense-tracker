import { Expense, ExpenseFilters } from '../types';

/**
 * Default/common payment methods. The backend `paymentMethod` field on
 * Expense is a free-text string, so this list is a sensible default set —
 * callers can always pass their own `paymentMethodOptions` to <AdvancedFilters />
 * (e.g. derived from distinct values already present in the data).
 */
export const DEFAULT_PAYMENT_METHODS: string[] = [
  'Cash',
  'Credit Card',
  'Debit Card',
  'UPI',
  'Net Banking',
  'Wallet',
  'Other',
];

export const EMPTY_EXPENSE_FILTERS: ExpenseFilters = {
  startDate: '',
  endDate: '',
  categories: [],
  minAmount: '',
  maxAmount: '',
  paymentMethods: [],
};

/** Returns a fresh copy of the empty filter state (safe to mutate). */
export function createEmptyFilters(): ExpenseFilters {
  return {
    startDate: '',
    endDate: '',
    categories: [],
    minAmount: '',
    maxAmount: '',
    paymentMethods: [],
  };
}

export function hasActiveFilters(filters: ExpenseFilters): boolean {
  return (
    !!filters.startDate ||
    !!filters.endDate ||
    filters.categories.length > 0 ||
    filters.minAmount.trim() !== '' ||
    filters.maxAmount.trim() !== '' ||
    filters.paymentMethods.length > 0
  );
}

/** Number of distinct filter groups currently active (used for the badge count). */
export function countActiveFilterGroups(filters: ExpenseFilters): number {
  let count = 0;
  if (filters.startDate || filters.endDate) count += 1;
  if (filters.categories.length > 0) count += 1;
  if (filters.minAmount.trim() !== '' || filters.maxAmount.trim() !== '') count += 1;
  if (filters.paymentMethods.length > 0) count += 1;
  return count;
}

/**
 * Validates the filter state and returns human-readable error messages
 * (empty array = valid). Does not mutate the input.
 */
export function validateExpenseFilters(filters: ExpenseFilters): string[] {
  const errors: string[] = [];

  if (filters.startDate && filters.endDate) {
    const start = new Date(filters.startDate);
    const end = new Date(filters.endDate);
    if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && start > end) {
      errors.push('"From" date must be before or equal to "To" date.');
    }
  }

  const min = filters.minAmount.trim();
  const max = filters.maxAmount.trim();

  if (min !== '' && (isNaN(Number(min)) || Number(min) < 0)) {
    errors.push('Minimum amount must be a valid non-negative number.');
  }
  if (max !== '' && (isNaN(Number(max)) || Number(max) < 0)) {
    errors.push('Maximum amount must be a valid non-negative number.');
  }
  if (
    min !== '' &&
    max !== '' &&
    !isNaN(Number(min)) &&
    !isNaN(Number(max)) &&
    Number(min) > Number(max)
  ) {
    errors.push('Minimum amount must be less than or equal to maximum amount.');
  }

  return errors;
}

/**
 * Applies an ExpenseFilters selection to a list of expenses, purely on the
 * client. Used to keep the expense list in sync with <AdvancedFilters />
 * without requiring backend query-param support for every combination
 * (multi-category / multi-payment-method).
 *
 * Invalid ranges (e.g. min > max, start > end) are ignored gracefully so a
 * mid-typing invalid value never hides all results — pair this with
 * `validateExpenseFilters` to surface warnings in the UI.
 */
export function filterExpenses(expenses: Expense[], filters: ExpenseFilters): Expense[] {
  if (!Array.isArray(expenses) || expenses.length === 0) return [];

  const errors = validateExpenseFilters(filters);

  const startDate = filters.startDate ? new Date(filters.startDate) : null;
  const endDate = filters.endDate ? new Date(filters.endDate) : null;
  if (endDate && !isNaN(endDate.getTime())) {
    // Include the entire "to" day.
    endDate.setHours(23, 59, 59, 999);
  }
  const dateRangeValid = !errors.some((e) => e.includes('date'));

  const minAmount =
    filters.minAmount.trim() !== '' && !isNaN(Number(filters.minAmount))
      ? Number(filters.minAmount)
      : null;
  const maxAmount =
    filters.maxAmount.trim() !== '' && !isNaN(Number(filters.maxAmount))
      ? Number(filters.maxAmount)
      : null;
  const amountRangeValid = !errors.some((e) => e.toLowerCase().includes('amount'));

  return expenses.filter((expense) => {
    if (dateRangeValid && (startDate || endDate)) {
      const expenseDate = new Date(expense.date);
      if (startDate && !isNaN(startDate.getTime()) && expenseDate < startDate) return false;
      if (endDate && !isNaN(endDate.getTime()) && expenseDate > endDate) return false;
    }

    if (filters.categories.length > 0 && !filters.categories.includes(expense.category)) {
      return false;
    }

    if (amountRangeValid) {
      if (minAmount !== null && expense.amount < minAmount) return false;
      if (maxAmount !== null && expense.amount > maxAmount) return false;
    }

    if (filters.paymentMethods.length > 0) {
      const method = expense.paymentMethod || 'Other';
      if (!filters.paymentMethods.includes(method)) return false;
    }

    return true;
  });
}

/**
 * Convenience helper to build backend query params for the filters the
 * `/expenses/:familyId` endpoint natively supports (date range + amount
 * range). Category/payment-method stay client-side since the API only
 * accepts a single `category` value today — see expenseService.getExpenses.
 */
export function toServerQueryParams(filters: ExpenseFilters): Record<string, string> {
  const params: Record<string, string> = {};
  if (filters.startDate) params.startDate = filters.startDate;
  if (filters.endDate) params.endDate = filters.endDate;
  if (filters.minAmount.trim() !== '' && !isNaN(Number(filters.minAmount))) {
    params.minAmount = filters.minAmount;
  }
  if (filters.maxAmount.trim() !== '' && !isNaN(Number(filters.maxAmount))) {
    params.maxAmount = filters.maxAmount;
  }
  return params;
}
