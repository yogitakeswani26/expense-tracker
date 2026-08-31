import { useMemo, useState } from 'react';
import AdvancedLayout from '../components/AdvancedLayout';
import BudgetModal, { BudgetModalMode } from '../components/BudgetModal';
import BudgetProgressBar from '../components/BudgetProgressBar';
import ConfirmDialog from '../components/ConfirmDialog';
import { useAuthStore } from '../stores/authStore';
import { useBudgets, useDeleteBudget } from '../hooks/useBudgets';
import { Budget } from '../types';
import { formatCurrency, getErrorMessage } from '../utils/helpers';
import { getCategoryEmoji } from '../utils/categoryEmojis';
import '../styles/global-advanced.css';

const STATUS_LABEL: Record<Budget['status'], string> = {
  ok: '✅ ON TRACK',
  warning: '⚡ NEAR LIMIT',
  exceeded: '⚠️ OVER BUDGET',
};

const STATUS_BADGE_STYLE: Record<Budget['status'], React.CSSProperties> = {
  ok: { background: 'rgba(16, 185, 129, 0.12)', color: '#10b981' },
  warning: { background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b' },
  exceeded: { background: 'rgba(239, 68, 68, 0.12)', color: '#ef4444' },
};

type FilterOption = 'all' | Budget['status'];

export default function Budgets() {
  const familyId = useAuthStore((s) => s.familyId);

  const { data: budgets = [], isLoading, isError, error, refetch, isFetching } = useBudgets(familyId || '');
  const deleteBudget = useDeleteBudget();

  const [statusFilter, setStatusFilter] = useState<FilterOption>('all');

  // Modal state
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);
  const [modalMode, setModalMode] = useState<BudgetModalMode>('create');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [budgetToDelete, setBudgetToDelete] = useState<Budget | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const filteredBudgets = useMemo(() => {
    if (statusFilter === 'all') return budgets;
    return budgets.filter((b) => b.status === statusFilter);
  }, [budgets, statusFilter]);

  const totals = useMemo(() => {
    const totalLimit = budgets.reduce((sum, b) => sum + b.limit, 0);
    const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0);
    const exceededCount = budgets.filter((b) => b.status === 'exceeded').length;
    const warningCount = budgets.filter((b) => b.status === 'warning').length;
    return { totalLimit, totalSpent, exceededCount, warningCount };
  }, [budgets]);

  // ----- Modal handlers -----
  const openCreate = () => {
    setSelectedBudget(null);
    setModalMode('create');
    setIsModalOpen(true);
  };

  const openEdit = (budget: Budget) => {
    setSelectedBudget(budget);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedBudget(null);
  };

  const openDeleteConfirm = (budget: Budget) => {
    setDeleteError(null);
    setBudgetToDelete(budget);
  };

  const closeDeleteConfirm = () => {
    if (deleteBudget.isPending) return;
    setBudgetToDelete(null);
    setDeleteError(null);
  };

  const handleConfirmDelete = async () => {
    if (!budgetToDelete || !familyId) return;
    setDeleteError(null);
    try {
      await deleteBudget.mutateAsync({ familyId, budgetId: budgetToDelete._id });
      setBudgetToDelete(null);
    } catch (err) {
      setDeleteError(getErrorMessage(err));
    }
  };

  if (!familyId) {
    return (
      <AdvancedLayout>
        <div className="page-header">
          <h1>🎯 Budget Management</h1>
          <p>Set spending limits by category and track them against real spend</p>
        </div>
        <div className="glass-card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          ⚠️ No family selected. Join or create a family to start budgeting.
        </div>
      </AdvancedLayout>
    );
  }

  return (
    <AdvancedLayout>
      {/* Page Header */}
      <div className="page-header">
        <h1>🎯 Budget Management</h1>
        <p>Set spending limits by category and track them against real spend</p>
      </div>

      {/* Stats Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '20px',
          marginBottom: '30px',
        }}
      >
        <div className="glass-card" style={{ padding: '20px' }}>
          <h3
            style={{
              margin: '0 0 8px 0',
              color: '#cbd5e1',
              fontSize: '0.9rem',
              fontWeight: 600,
              textTransform: 'uppercase',
            }}
          >
            Total Budgeted
          </h3>
          <div
            style={{
              fontSize: '2rem',
              fontWeight: 800,
              background: 'linear-gradient(135deg, #667eea, #06b6d4)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            {formatCurrency(totals.totalLimit)}
          </div>
        </div>
        <div className="glass-card" style={{ padding: '20px' }}>
          <h3
            style={{
              margin: '0 0 8px 0',
              color: '#cbd5e1',
              fontSize: '0.9rem',
              fontWeight: 600,
              textTransform: 'uppercase',
            }}
          >
            Total Spent
          </h3>
          <div
            style={{
              fontSize: '2rem',
              fontWeight: 800,
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            {formatCurrency(totals.totalSpent)}
          </div>
        </div>
        <div className="glass-card" style={{ padding: '20px' }}>
          <h3
            style={{
              margin: '0 0 8px 0',
              color: '#cbd5e1',
              fontSize: '0.9rem',
              fontWeight: 600,
              textTransform: 'uppercase',
            }}
          >
            Over Budget
          </h3>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: totals.exceededCount > 0 ? '#ef4444' : '#10b981' }}>
            {totals.exceededCount}
          </div>
        </div>
        <div className="glass-card" style={{ padding: '20px' }}>
          <h3
            style={{
              margin: '0 0 8px 0',
              color: '#cbd5e1',
              fontSize: '0.9rem',
              fontWeight: 600,
              textTransform: 'uppercase',
            }}
          >
            Near Limit
          </h3>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: totals.warningCount > 0 ? '#f59e0b' : '#10b981' }}>
            {totals.warningCount}
          </div>
        </div>
      </div>

      {/* Filters & Controls */}
      <div className="glass-card" style={{ marginBottom: '30px', padding: '20px' }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div className="form-group" style={{ minWidth: '220px', marginBottom: 0 }}>
            <label className="form-label">Filter by status</label>
            <select
              className="form-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as FilterOption)}
            >
              <option value="all">All Budgets</option>
              <option value="ok">✅ On Track</option>
              <option value="warning">⚡ Near Limit</option>
              <option value="exceeded">⚠️ Over Budget</option>
            </select>
          </div>
          <button className="btn btn-primary" onClick={() => refetch()} disabled={isFetching}>
            {isFetching ? '⏳ Refreshing…' : '🔄 Refresh'}
          </button>
        </div>
      </div>

      {/* Budgets Grid */}
      {isLoading ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '40px', color: '#cbd5e1' }}>
          ⏳ Loading budgets...
        </div>
      ) : isError ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '40px', color: '#fca5a5' }}>
          ⚠️ {getErrorMessage(error)}
          <div style={{ marginTop: '16px' }}>
            <button className="btn btn-secondary" onClick={() => refetch()}>
              Try Again
            </button>
          </div>
        </div>
      ) : filteredBudgets.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '40px', color: '#cbd5e1' }}>
          {budgets.length === 0 ? (
            <>
              📭 No budgets yet. Create one to start tracking spend against a limit.
              <div style={{ marginTop: '16px' }}>
                <button className="btn btn-primary" onClick={openCreate}>
                  🎯 Create Your First Budget
                </button>
              </div>
            </>
          ) : (
            '📭 No budgets match this filter'
          )}
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '20px',
          }}
        >
          {filteredBudgets.map((budget) => (
            <div key={budget._id} className="glass-card" style={{ padding: '20px' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '12px',
                  gap: '10px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '1.6rem' }}>{getCategoryEmoji(budget.category)}</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>{budget.category}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', textTransform: 'capitalize' }}>
                      {budget.period}
                    </div>
                  </div>
                </div>
                <span
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    padding: '4px 10px',
                    borderRadius: '999px',
                    whiteSpace: 'nowrap',
                    ...STATUS_BADGE_STYLE[budget.status],
                  }}
                >
                  {STATUS_LABEL[budget.status]}
                </span>
              </div>

              <BudgetProgressBar
                spent={budget.spent}
                limit={budget.limit}
                percentage={budget.percentage}
                status={budget.status}
                height={10}
              />

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginTop: '10px',
                  fontSize: '0.9rem',
                }}
              >
                <span style={{ color: 'var(--text-secondary)' }}>
                  {formatCurrency(budget.spent)} <span style={{ color: 'var(--text-tertiary)' }}>of</span>{' '}
                  {formatCurrency(budget.limit)}
                </span>
                <span style={{ fontWeight: 700 }}>{budget.percentage.toFixed(0)}%</span>
              </div>

              <div style={{ fontSize: '0.82rem', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                {budget.status === 'exceeded'
                  ? `Over by ${formatCurrency(budget.spent - budget.limit)}`
                  : `${formatCurrency(budget.remaining)} remaining · alerts at ${budget.alertThreshold}%`}
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                <button
                  className="btn btn-secondary"
                  style={{ padding: '8px 12px', fontSize: '0.85rem', flex: 1 }}
                  onClick={() => openEdit(budget)}
                >
                  ✏️ Edit
                </button>
                <button
                  className="btn btn-danger"
                  style={{ padding: '8px 12px', fontSize: '0.85rem', flex: 1 }}
                  onClick={() => openDeleteConfirm(budget)}
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Button */}
      {budgets.length > 0 && (
        <button
          className="btn btn-primary"
          style={{
            position: 'fixed',
            bottom: '40px',
            right: '40px',
            padding: '16px 24px',
            fontSize: '1rem',
            borderRadius: '12px',
            boxShadow: '0 10px 40px rgba(102, 126, 234, 0.4)',
          }}
          onClick={openCreate}
        >
          ➕ Add Budget
        </button>
      )}

      {/* Create / Edit Modal */}
      <BudgetModal
        isOpen={isModalOpen}
        onClose={closeModal}
        budget={selectedBudget}
        familyId={familyId}
        mode={modalMode}
        existingBudgets={budgets}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!budgetToDelete}
        onClose={closeDeleteConfirm}
        onConfirm={handleConfirmDelete}
        title="Delete Budget?"
        tone="danger"
        confirmLabel="🗑️ Delete"
        isLoading={deleteBudget.isPending}
        error={deleteError}
        message={
          budgetToDelete ? (
            <>
              Are you sure you want to delete the <strong>{budgetToDelete.category}</strong> budget (
              {formatCurrency(budgetToDelete.limit)}/{budgetToDelete.period})? This action cannot be undone.
            </>
          ) : (
            ''
          )
        }
      />
    </AdvancedLayout>
  );
}
