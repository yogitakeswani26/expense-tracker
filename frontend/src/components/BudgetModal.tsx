import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import Modal from './Modal';
import { Budget } from '../types';
import { useCreateBudget, useUpdateBudget } from '../hooks/useBudgets';
import { useFamilyCategories } from '../hooks/useCategories';
import { getErrorMessage } from '../utils/helpers';
import { getCategoryEmoji, FALLBACK_CATEGORIES } from '../utils/categoryEmojis';

export type BudgetModalMode = 'create' | 'edit';

interface BudgetFormValues {
  category: string;
  limit: number;
  period: 'monthly' | 'yearly';
  alertThreshold: number;
}

interface BudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Budget being edited. Omit (or pass null) when mode is 'create'. */
  budget: Budget | null;
  familyId: string;
  mode: BudgetModalMode;
  /** Existing budgets — used to keep the category dropdown from offering duplicates. */
  existingBudgets?: Budget[];
  onSaved?: (budget: Budget) => void;
}

const emptyDefaults: BudgetFormValues = {
  category: '',
  limit: '' as unknown as number,
  period: 'monthly',
  alertThreshold: 80,
};

export default function BudgetModal({
  isOpen,
  onClose,
  budget,
  familyId,
  mode,
  existingBudgets = [],
  onSaved,
}: BudgetModalProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);

  const createBudget = useCreateBudget();
  const updateBudget = useUpdateBudget();
  const { data: categoryData } = useFamilyCategories(familyId);

  const isSaving = createBudget.isPending || updateBudget.isPending;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isDirty },
  } = useForm<BudgetFormValues>({
    defaultValues: emptyDefaults,
    mode: 'onBlur',
  });

  const selectedPeriod = watch('period');

  // Categories already budgeted for the currently-selected period — hide them from
  // the picker on create so users can't accidentally try to create a duplicate.
  const categoriesTakenForPeriod = useMemo(() => {
    return new Set(
      existingBudgets
        .filter((b) => b.period === selectedPeriod && b._id !== budget?._id)
        .map((b) => b.category)
    );
  }, [existingBudgets, selectedPeriod, budget]);

  const categoryOptions = useMemo<string[]>(() => {
    const fromApi: string[] = Array.isArray(categoryData?.categories)
      ? categoryData.categories.map((c: any) => c.name).filter(Boolean)
      : [];
    const merged = new Set<string>([...fromApi, ...FALLBACK_CATEGORIES]);
    if (budget?.category) merged.add(budget.category);
    return Array.from(merged).filter((cat) => cat === budget?.category || !categoriesTakenForPeriod.has(cat));
  }, [categoryData, budget, categoriesTakenForPeriod]);

  // Reset form values whenever the modal opens or the target budget changes
  useEffect(() => {
    if (!isOpen) return;
    setSubmitError(null);

    if (budget) {
      reset({
        category: budget.category,
        limit: budget.limit,
        period: budget.period,
        alertThreshold: budget.alertThreshold ?? 80,
      });
    } else {
      reset(emptyDefaults);
    }
  }, [isOpen, budget, reset]);

  const handleClose = () => {
    if (isSaving) return;
    setSubmitError(null);
    onClose();
  };

  const onSubmit = async (values: BudgetFormValues) => {
    setSubmitError(null);

    try {
      if (mode === 'create') {
        const saved = await createBudget.mutateAsync({
          familyId,
          category: values.category,
          limit: Number(values.limit),
          period: values.period,
          alertThreshold: Number(values.alertThreshold),
        });
        onSaved?.(saved);
        onClose();
      } else if (budget) {
        const saved = await updateBudget.mutateAsync({
          familyId,
          budgetId: budget._id,
          limit: Number(values.limit),
          alertThreshold: Number(values.alertThreshold),
        });
        onSaved?.(saved);
        onClose();
      }
    } catch (err) {
      setSubmitError(getErrorMessage(err));
    }
  };

  const alertThresholdValue = watch('alertThreshold');

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={mode === 'create' ? '🎯 Create Budget' : '✏️ Edit Budget'}
      size="md"
      closeOnBackdrop={!isSaving}
      closeOnEsc={!isSaving}
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="form-row-2">
          <div className="form-group">
            <label className="form-label" htmlFor="budget-category">
              Category
            </label>
            <select
              id="budget-category"
              className="form-select"
              disabled={isSaving || mode === 'edit'}
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
            <label className="form-label" htmlFor="budget-period">
              Period
            </label>
            <select
              id="budget-period"
              className="form-select"
              disabled={isSaving || mode === 'edit'}
              {...register('period', { required: true })}
            >
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
        </div>

        {mode === 'edit' && (
          <p style={{ margin: '-8px 0 16px 0', fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
            Category and period are locked after creation — delete and recreate the budget to change them.
          </p>
        )}

        <div className="form-group">
          <label className="form-label" htmlFor="budget-limit">
            Budget Limit (₹)
          </label>
          <input
            id="budget-limit"
            className="form-input"
            type="number"
            step="0.01"
            min="0.01"
            placeholder="e.g. 5000"
            disabled={isSaving}
            {...register('limit', {
              required: 'Budget limit is required',
              valueAsNumber: true,
              min: { value: 0.01, message: 'Limit must be greater than 0' },
              max: { value: 100000000, message: 'Limit is too large' },
              validate: (v) => !isNaN(v) || 'Limit must be a valid number',
            })}
          />
          {errors.limit && <span className="form-error">{errors.limit.message}</span>}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="budget-alert-threshold">
            Alert me at {alertThresholdValue || 80}% spent
          </label>
          <input
            id="budget-alert-threshold"
            type="range"
            min={1}
            max={100}
            step={1}
            disabled={isSaving}
            {...register('alertThreshold', { valueAsNumber: true, min: 1, max: 100 })}
            style={{ width: '100%', accentColor: '#667eea' }}
          />
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '0.75rem',
              color: 'var(--text-tertiary)',
            }}
          >
            <span>1%</span>
            <span>100%</span>
          </div>
          {errors.alertThreshold && (
            <span className="form-error">Threshold must be between 1 and 100</span>
          )}
        </div>

        {submitError && <div className="modal-error-banner">⚠️ {submitError}</div>}

        <div className="modal-footer-actions" style={{ marginTop: '8px' }}>
          <button type="button" className="btn btn-secondary" onClick={handleClose} disabled={isSaving}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={isSaving || (mode === 'edit' && !isDirty)}>
            {isSaving ? (
              <>
                <span className="btn-spinner" /> Saving…
              </>
            ) : mode === 'create' ? (
              '🎯 Create Budget'
            ) : (
              '💾 Save Changes'
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
