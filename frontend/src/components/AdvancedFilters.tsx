import { useEffect, useId, useMemo, useState } from 'react';
import { ExpenseFilters } from '../types';
import {
  DEFAULT_PAYMENT_METHODS,
  countActiveFilterGroups,
  createEmptyFilters,
  hasActiveFilters,
  validateExpenseFilters,
} from '../utils/expenseFilters';
import { getCategoryEmoji } from '../utils/categoryEmojis';

export interface AdvancedFiltersProps {
  /** Controlled filter state (source of truth lives in the parent). */
  filters: ExpenseFilters;
  /** Called with the next filter state on every change. */
  onChange: (filters: ExpenseFilters) => void;
  /** Distinct category names available to filter by (e.g. from the loaded expense list or /categories). */
  categoryOptions: string[];
  /** Distinct payment methods to offer. Defaults to a common preset. */
  paymentMethodOptions?: string[];
  /** Called after the internal Reset button clears the filters (in addition to onChange). */
  onReset?: () => void;
  /** Whether the panel starts expanded. Defaults to true. */
  defaultOpen?: boolean;
  /** Optional "X of Y expenses" summary shown in the header. */
  resultCount?: number;
  totalCount?: number;
  className?: string;
}

/**
 * Self-contained, controlled advanced-filter panel for the expense list.
 *
 * Usage:
 *   const [filters, setFilters] = useState<ExpenseFilters>(createEmptyFilters());
 *   const visible = useMemo(() => filterExpenses(expenses, filters), [expenses, filters]);
 *   <AdvancedFilters
 *     filters={filters}
 *     onChange={setFilters}
 *     categoryOptions={[...new Set(expenses.map(e => e.category))]}
 *     resultCount={visible.length}
 *     totalCount={expenses.length}
 *   />
 */
export default function AdvancedFilters({
  filters,
  onChange,
  categoryOptions,
  paymentMethodOptions = DEFAULT_PAYMENT_METHODS,
  onReset,
  defaultOpen = true,
  resultCount,
  totalCount,
  className = '',
}: AdvancedFiltersProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [categorySearch, setCategorySearch] = useState('');
  const panelId = useId();

  const activeCount = useMemo(() => countActiveFilterGroups(filters), [filters]);
  const isActive = hasActiveFilters(filters);
  const errors = useMemo(() => validateExpenseFilters(filters), [filters]);

  // Keep the category search box relevant if the option list shrinks/changes.
  useEffect(() => {
    setCategorySearch('');
  }, [categoryOptions.length]);

  const filteredCategoryOptions = useMemo(() => {
    const q = categorySearch.trim().toLowerCase();
    if (!q) return categoryOptions;
    return categoryOptions.filter((c) => c.toLowerCase().includes(q));
  }, [categoryOptions, categorySearch]);

  const update = (patch: Partial<ExpenseFilters>) => {
    onChange({ ...filters, ...patch });
  };

  const toggleInArray = (key: 'categories' | 'paymentMethods', value: string) => {
    const current = filters[key];
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    update({ [key]: next } as Partial<ExpenseFilters>);
  };

  const handleReset = () => {
    onChange(createEmptyFilters());
    setCategorySearch('');
    onReset?.();
  };

  const removeChip = (kind: 'startDate' | 'endDate' | 'amount' | 'category' | 'paymentMethod', value?: string) => {
    if (kind === 'startDate') update({ startDate: '' });
    else if (kind === 'endDate') update({ endDate: '' });
    else if (kind === 'amount') update({ minAmount: '', maxAmount: '' });
    else if (kind === 'category' && value) toggleInArray('categories', value);
    else if (kind === 'paymentMethod' && value) toggleInArray('paymentMethods', value);
  };

  return (
    <div className={`bg-white rounded-lg shadow border border-gray-200 ${className}`}>
      {/* Header / toggle */}
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        aria-expanded={isOpen}
        aria-controls={panelId}
        className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left"
      >
        <div className="flex items-center gap-3">
          <span className="text-lg font-semibold text-gray-900">🔍 Advanced Filters</span>
          {activeCount > 0 && (
            <span className="inline-flex items-center justify-center min-w-[1.5rem] h-6 px-2 rounded-full bg-blue-600 text-white text-xs font-bold">
              {activeCount}
            </span>
          )}
          {typeof resultCount === 'number' && typeof totalCount === 'number' && (
            <span className="text-sm text-gray-500 hidden sm:inline">
              Showing {resultCount.toLocaleString()} of {totalCount.toLocaleString()} expenses
            </span>
          )}
        </div>
        <span className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} aria-hidden="true">
          ▾
        </span>
      </button>

      {isOpen && (
        <div id={panelId} className="px-5 pb-5 border-t border-gray-100">
          {/* Active filter chips */}
          {isActive && (
            <div className="flex flex-wrap gap-2 pt-4 pb-1">
              {(filters.startDate || filters.endDate) && (
                <FilterChip
                  label={`📅 ${filters.startDate || '…'} → ${filters.endDate || '…'}`}
                  onRemove={() => {
                    update({ startDate: '', endDate: '' });
                  }}
                />
              )}
              {filters.categories.map((c) => (
                <FilterChip key={`cat-${c}`} label={`${getCategoryEmoji(c)} ${c}`} onRemove={() => removeChip('category', c)} />
              ))}
              {(filters.minAmount || filters.maxAmount) && (
                <FilterChip
                  label={`₹ ${filters.minAmount || '0'} – ${filters.maxAmount || '∞'}`}
                  onRemove={() => removeChip('amount')}
                />
              )}
              {filters.paymentMethods.map((p) => (
                <FilterChip key={`pm-${p}`} label={p} onRemove={() => removeChip('paymentMethod', p)} />
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 pt-4">
            {/* Date range picker */}
            <fieldset className="min-w-0">
              <legend className="block text-sm font-semibold text-gray-700 mb-2">Date Range</legend>
              <div className="flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <label className="sr-only" htmlFor={`${panelId}-start`}>From date</label>
                  <input
                    id={`${panelId}-start`}
                    type="date"
                    value={filters.startDate}
                    max={filters.endDate || undefined}
                    onChange={(e) => update({ startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
                <span className="text-gray-400">–</span>
                <div className="flex-1 min-w-0">
                  <label className="sr-only" htmlFor={`${panelId}-end`}>To date</label>
                  <input
                    id={`${panelId}-end`}
                    type="date"
                    value={filters.endDate}
                    min={filters.startDate || undefined}
                    onChange={(e) => update({ endDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
              </div>
            </fieldset>

            {/* Amount range filter */}
            <fieldset className="min-w-0">
              <legend className="block text-sm font-semibold text-gray-700 mb-2">Amount Range (₹)</legend>
              <div className="flex items-center gap-2">
                <div className="relative flex-1 min-w-0">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                  <label className="sr-only" htmlFor={`${panelId}-min`}>Minimum amount</label>
                  <input
                    id={`${panelId}-min`}
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step="0.01"
                    placeholder="Min"
                    value={filters.minAmount}
                    onChange={(e) => update({ minAmount: e.target.value })}
                    className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
                <span className="text-gray-400">–</span>
                <div className="relative flex-1 min-w-0">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                  <label className="sr-only" htmlFor={`${panelId}-max`}>Maximum amount</label>
                  <input
                    id={`${panelId}-max`}
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step="0.01"
                    placeholder="Max"
                    value={filters.maxAmount}
                    onChange={(e) => update({ maxAmount: e.target.value })}
                    className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
              </div>
            </fieldset>

            {/* Category filter (multi-select) */}
            <fieldset className="min-w-0">
              <legend className="block text-sm font-semibold text-gray-700 mb-2">
                Categories {filters.categories.length > 0 && `(${filters.categories.length})`}
              </legend>
              {categoryOptions.length > 6 && (
                <input
                  type="text"
                  placeholder="Search categories…"
                  value={categorySearch}
                  onChange={(e) => setCategorySearch(e.target.value)}
                  className="w-full mb-2 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              )}
              <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
                {filteredCategoryOptions.length === 0 ? (
                  <p className="px-3 py-3 text-sm text-gray-500">No categories found</p>
                ) : (
                  filteredCategoryOptions.map((cat) => (
                    <label
                      key={cat}
                      className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-blue-50"
                    >
                      <input
                        type="checkbox"
                        checked={filters.categories.includes(cat)}
                        onChange={() => toggleInArray('categories', cat)}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span>{getCategoryEmoji(cat)}</span>
                      <span className="truncate">{cat}</span>
                    </label>
                  ))
                )}
              </div>
            </fieldset>

            {/* Payment method filter */}
            <fieldset className="min-w-0">
              <legend className="block text-sm font-semibold text-gray-700 mb-2">
                Payment Method {filters.paymentMethods.length > 0 && `(${filters.paymentMethods.length})`}
              </legend>
              <div className="flex flex-wrap gap-2">
                {paymentMethodOptions.map((method) => {
                  const active = filters.paymentMethods.includes(method);
                  return (
                    <button
                      type="button"
                      key={method}
                      onClick={() => toggleInArray('paymentMethods', method)}
                      aria-pressed={active}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium border transition ${
                        active
                          ? 'bg-blue-600 border-blue-600 text-white'
                          : 'bg-white border-gray-300 text-gray-700 hover:border-blue-400 hover:text-blue-700'
                      }`}
                    >
                      {method}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          </div>

          {/* Validation warnings */}
          {errors.length > 0 && (
            <div className="mt-4 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
              {errors.map((err) => (
                <p key={err}>⚠️ {err}</p>
              ))}
            </div>
          )}

          {/* Footer actions */}
          <div className="flex items-center justify-between pt-4 mt-2 border-t border-gray-100">
            <span className="text-xs text-gray-500">
              {isActive ? `${activeCount} filter${activeCount === 1 ? '' : 's'} applied` : 'No filters applied'}
            </span>
            <button
              type="button"
              onClick={handleReset}
              disabled={!isActive}
              className="px-4 py-2 text-sm font-semibold rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              ↺ Reset Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 pl-3 pr-1.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-xs font-medium">
      {label}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove filter ${label}`}
        className="flex items-center justify-center w-4 h-4 rounded-full hover:bg-blue-200 transition"
      >
        ×
      </button>
    </span>
  );
}
