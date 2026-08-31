import React, { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import Modal from './Modal';
import { Expense } from '../types';
import { useCreateExpense, useUpdateExpense } from '../hooks/useExpenses';
import { useFamilyCategories } from '../hooks/useCategories';
import { formatCurrency, formatDateLong, getErrorMessage } from '../utils/helpers';
import { getCategoryEmoji, FALLBACK_CATEGORIES } from '../utils/categoryEmojis';

export type ExpenseModalMode = 'view' | 'edit' | 'create';

interface ExpenseFormValues {
  description: string;
  amount: number;
  category: string;
  date: string;
  paymentMethod: string;
  tags: string;
}

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Expense being viewed/edited. Omit (or pass null) when mode is 'create'. */
  expense: Expense | null;
  /** Family this expense belongs (or will belong) to — required for API calls. */
  familyId: string;
  initialMode: ExpenseModalMode;
  /** Called after a successful create/update, with the saved expense. */
  onSaved?: (expense: Expense) => void;
}

const PAYMENT_METHODS = ['Cash', 'Card', 'UPI', 'Bank Transfer', 'Wallet', 'Other'];

const toDateInputValue = (value?: string) => {
  if (!value) return new Date().toISOString().slice(0, 10);
  const d = new Date(value);
  if (isNaN(d.getTime())) return new Date().toISOString().slice(0, 10);
  return d.toISOString().slice(0, 10);
};

const emptyDefaults: ExpenseFormValues = {
  description: '',
  amount: '' as unknown as number,
  category: '',
  date: toDateInputValue(),
  paymentMethod: 'Cash',
  tags: '',
};

export default function ExpenseModal({
  isOpen,
  onClose,
  expense,
  familyId,
  initialMode,
  onSaved,
}: ExpenseModalProps) {
  const [mode, setMode] = useState<ExpenseModalMode>(initialMode);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const createExpense = useCreateExpense();
  const updateExpense = useUpdateExpense();
  const { data: categoryData } = useFamilyCategories(familyId);

  const isSaving = createExpense.isPending || updateExpense.isPending;

  const categoryOptions = useMemo<string[]>(() => {
    const fromApi: string[] = Array.isArray(categoryData?.categories)
      ? categoryData.categories.map((c: any) => c.name).filter(Boolean)
      : [];
    const merged = new Set<string>([...fromApi, ...FALLBACK_CATEGORIES]);
    if (expense?.category) merged.add(expense.category);
    return Array.from(merged);
  }, [categoryData, expense]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<ExpenseFormValues>({
    defaultValues: emptyDefaults,
    mode: 'onBlur',
  });

  // Reset mode + form values whenever the modal opens or the target expense changes
  useEffect(() => {
    if (!isOpen) return;
    setMode(initialMode);
    setSubmitError(null);

    if (expense) {
      reset({
        description: expense.description,
        amount: expense.amount,
        category: expense.category,
        date: toDateInputValue(expense.date),
        paymentMethod: (expense as any).paymentMethod || 'Cash',
        tags: Array.isArray(expense.tags) ? expense.tags.join(', ') : '',
      });
    } else {
      reset(emptyDefaults);
    }
  }, [isOpen, expense, initialMode, reset]);

  const handleClose = () => {
    if (isSaving) return;
    setSubmitError(null);
    onClose();
  };

  const onSubmit = async (values: ExpenseFormValues) => {
    setSubmitError(null);

    const payload = {
      description: values.description.trim(),
      amount: Number(values.amount),
      category: values.category,
      date: values.date,
      paymentMethod: values.paymentMethod || undefined,
      tags: values.tags
        ? values.tags.split(',').map((t) => t.trim()).filter(Boolean)
        : [],
    };

    try {
      if (mode === 'create') {
        const saved = await createExpense.mutateAsync({ familyId, ...payload });
        onSaved?.(saved);
        onClose();
      } else if (expense) {
        const saved = await updateExpense.mutateAsync({
          familyId,
          expenseId: expense._id,
          ...payload,
        });
        onSaved?.(saved);
        setMode('view');
        onClose();
      }
    } catch (err) {
      setSubmitError(getErrorMessage(err));
    }
  };

  const title =
    mode === 'create' ? '➕ Add Expense' : mode === 'edit' ? '✏️ Edit Expense' : '💳 Expense Details';

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={title} size="md" closeOnBackdrop={!isSaving} closeOnEsc={!isSaving}>
      {mode === 'view' && expense ? (
        <ExpenseViewBody
          expense={expense}
          onEdit={() => setMode('edit')}
        />
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="expense-description">
              Description
            </label>
            <input
              id="expense-description"
              className="form-input"
              type="text"
              placeholder="e.g. Grocery shopping"
              disabled={isSaving}
              {...register('description', {
                required: 'Description is required',
                maxLength: { value: 200, message: 'Description must be under 200 characters' },
                validate: (v) => v.trim().length > 0 || 'Description is required',
              })}
            />
            {errors.description && <span className="form-error">{errors.description.message}</span>}
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label className="form-label" htmlFor="expense-amount">
                Amount (₹)
              </label>
              <input
                id="expense-amount"
                className="form-input"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                disabled={isSaving}
                {...register('amount', {
                  required: 'Amount is required',
                  valueAsNumber: true,
                  min: { value: 0.01, message: 'Amount must be greater than 0' },
                  max: { value: 10000000, message: 'Amount is too large' },
                  validate: (v) => !isNaN(v) || 'Amount must be a valid number',
                })}
              />
              {errors.amount && <span className="form-error">{errors.amount.message}</span>}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="expense-date">
                Date
              </label>
              <input
                id="expense-date"
                className="form-input"
                type="date"
                max={new Date().toISOString().slice(0, 10)}
                disabled={isSaving}
                {...register('date', { required: 'Date is required' })}
              />
              {errors.date && <span className="form-error">{errors.date.message}</span>}
            </div>
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label className="form-label" htmlFor="expense-category">
                Category
              </label>
              <select
                id="expense-category"
                className="form-select"
                disabled={isSaving}
                {...register('category', { required: 'Category is required' })}
              >
                <option value="">Select category…</option>
                {categoryOptions.map((cat) => (
                  <option key={cat} value={cat}>
                    {getCategoryEmoji(cat)} {cat}
                  </option>
                ))}
              </select>
              {errors.category && <span className="form-error">{errors.category.message}</span>}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="expense-payment-method">
                Payment Method
              </label>
              <select
                id="expense-payment-method"
                className="form-select"
                disabled={isSaving}
                {...register('paymentMethod')}
              >
                {PAYMENT_METHODS.map((pm) => (
                  <option key={pm} value={pm}>
                    {pm}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="expense-tags">
              Tags <span style={{ fontWeight: 400, color: 'var(--text-tertiary)' }}>(comma separated, optional)</span>
            </label>
            <input
              id="expense-tags"
              className="form-input"
              type="text"
              placeholder="e.g. work, reimbursable"
              disabled={isSaving}
              {...register('tags')}
            />
          </div>

          {submitError && <div className="modal-error-banner">⚠️ {submitError}</div>}

          <div className="modal-footer-actions" style={{ marginTop: '8px' }}>
            {mode === 'edit' && expense ? (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setMode('view')}
                disabled={isSaving}
              >
                Cancel
              </button>
            ) : (
              <button type="button" className="btn btn-secondary" onClick={handleClose} disabled={isSaving}>
                Cancel
              </button>
            )}
            <button type="submit" className="btn btn-primary" disabled={isSaving || (mode === 'edit' && !isDirty)}>
              {isSaving ? (
                <>
                  <span className="btn-spinner" /> Saving…
                </>
              ) : mode === 'create' ? (
                '➕ Add Expense'
              ) : (
                '💾 Save Changes'
              )}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}

function ExpenseViewBody({ expense, onEdit }: { expense: Expense; onEdit: () => void }) {
  return (
    <div className="expense-view">
      <div className="expense-view-amount">
        <span className="expense-view-emoji">{getCategoryEmoji(expense.category)}</span>
        {formatCurrency(expense.amount)}
      </div>
      <h3 className="expense-view-description">{expense.description}</h3>

      <div className="expense-view-grid">
        <div>
          <span className="expense-view-label">Category</span>
          <span className="expense-view-value">
            {getCategoryEmoji(expense.category)} {expense.category}
          </span>
        </div>
        <div>
          <span className="expense-view-label">Date</span>
          <span className="expense-view-value">{formatDateLong(expense.date)}</span>
        </div>
        <div>
          <span className="expense-view-label">Paid By</span>
          <span className="expense-view-value">{expense.paidBy?.name || '—'}</span>
        </div>
        <div>
          <span className="expense-view-label">Added On</span>
          <span className="expense-view-value">
            {expense.createdAt ? formatDateLong(expense.createdAt) : '—'}
          </span>
        </div>
      </div>

      {expense.tags && expense.tags.length > 0 && (
        <div className="expense-view-tags">
          {expense.tags.map((tag) => (
            <span key={tag} className="expense-view-tag">
              #{tag}
            </span>
          ))}
        </div>
      )}

      {expense.splits && expense.splits.length > 0 && (
        <div className="expense-view-splits">
          <span className="expense-view-label">Splits</span>
          <ul>
            {expense.splits.map((s, i) => (
              <li key={i}>{formatCurrency(s.amount)}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="modal-footer-actions" style={{ marginTop: '24px' }}>
        <button type="button" className="btn btn-primary" onClick={onEdit}>
          ✏️ Edit Expense
        </button>
      </div>
    </div>
  );
}
