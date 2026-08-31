import React, { useMemo, useState } from 'react';
import AdvancedLayout from '../components/AdvancedLayout';
import ExpenseModal, { ExpenseModalMode } from '../components/ExpenseModal';
import ConfirmDialog from '../components/ConfirmDialog';
import { useAuthStore } from '../stores/authStore';
import { useExpenses, useDeleteExpense } from '../hooks/useExpenses';
import { Expense } from '../types';
import { formatCurrency, formatDate, getErrorMessage } from '../utils/helpers';
import { getCategoryEmoji } from '../utils/categoryEmojis';
import '../styles/global-advanced.css';

type SortOption = 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc';

export default function ExpensesAdvanced() {
  const familyId = useAuthStore((s) => s.familyId);

  const { data, isLoading, isError, error, refetch, isFetching } = useExpenses(familyId || '');
  const deleteExpense = useDeleteExpense();

  const [filter, setFilter] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('date-desc');

  // Modal state
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [modalMode, setModalMode] = useState<ExpenseModalMode>('view');
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);

  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // `useExpenses` returns whatever the API responds with under `.data` — normalize
  // it to an array whether the backend paginates (`{ expenses: [...] }`) or not.
  const expenses: Expense[] = useMemo(() => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.expenses)) return data.expenses;
    return [];
  }, [data]);

  const sortedExpenses = useMemo(() => {
    const term = filter.trim().toLowerCase();
    return [...expenses]
      .filter(
        (e) =>
          !term ||
          e.description?.toLowerCase().includes(term) ||
          e.category?.toLowerCase().includes(term)
      )
      .sort((a, b) => {
        switch (sortBy) {
          case 'date-desc':
            return new Date(b.date).getTime() - new Date(a.date).getTime();
          case 'date-asc':
            return new Date(a.date).getTime() - new Date(b.date).getTime();
          case 'amount-desc':
            return b.amount - a.amount;
          case 'amount-asc':
            return a.amount - b.amount;
          default:
            return 0;
        }
      });
  }, [expenses, filter, sortBy]);

  const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const averageExpense = expenses.length > 0 ? totalExpenses / expenses.length : 0;

  // ----- Modal handlers -----
  const openView = (expense: Expense) => {
    setSelectedExpense(expense);
    setModalMode('view');
    setIsExpenseModalOpen(true);
  };

  const openEdit = (expense: Expense) => {
    setSelectedExpense(expense);
    setModalMode('edit');
    setIsExpenseModalOpen(true);
  };

  const openCreate = () => {
    setSelectedExpense(null);
    setModalMode('create');
    setIsExpenseModalOpen(true);
  };

  const closeExpenseModal = () => {
    setIsExpenseModalOpen(false);
    setSelectedExpense(null);
  };

  const openDeleteConfirm = (expense: Expense) => {
    setDeleteError(null);
    setExpenseToDelete(expense);
  };

  const closeDeleteConfirm = () => {
    if (deleteExpense.isPending) return;
    setExpenseToDelete(null);
    setDeleteError(null);
  };

  const handleConfirmDelete = async () => {
    if (!expenseToDelete || !familyId) return;
    setDeleteError(null);
    try {
      await deleteExpense.mutateAsync({ familyId, expenseId: expenseToDelete._id });
      setExpenseToDelete(null);
    } catch (err) {
      setDeleteError(getErrorMessage(err));
    }
  };

  if (!familyId) {
    return (
      <AdvancedLayout>
        <div className="page-header">
          <h1>💳 Expense Management</h1>
          <p>Track and manage all your expenses with advanced analytics</p>
        </div>
        <div className="glass-card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          ⚠️ No family selected. Join or create a family to start tracking expenses.
        </div>
      </AdvancedLayout>
    );
  }

  return (
    <AdvancedLayout>
      {/* Page Header */}
      <div className="page-header">
        <h1>💳 Expense Management</h1>
        <p>Track and manage all your expenses with advanced analytics</p>
      </div>

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '40px' }}>
        <div className="glass-card" style={{ padding: '20px' }}>
          <h3 style={{ margin: '0 0 8px 0', color: '#cbd5e1', fontSize: '0.9rem', fontWeight: '600', textTransform: 'uppercase' }}>Total Expenses</h3>
          <div style={{ fontSize: '2rem', fontWeight: '800', background: 'linear-gradient(135deg, #667eea, #06b6d4)', backgroundClip: 'text', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            {formatCurrency(totalExpenses)}
          </div>
        </div>
        <div className="glass-card" style={{ padding: '20px' }}>
          <h3 style={{ margin: '0 0 8px 0', color: '#cbd5e1', fontSize: '0.9rem', fontWeight: '600', textTransform: 'uppercase' }}>Average Expense</h3>
          <div style={{ fontSize: '2rem', fontWeight: '800', background: 'linear-gradient(135deg, #f59e0b, #d97706)', backgroundClip: 'text', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            {formatCurrency(averageExpense)}
          </div>
        </div>
        <div className="glass-card" style={{ padding: '20px' }}>
          <h3 style={{ margin: '0 0 8px 0', color: '#cbd5e1', fontSize: '0.9rem', fontWeight: '600', textTransform: 'uppercase' }}>Total Transactions</h3>
          <div style={{ fontSize: '2rem', fontWeight: '800', background: 'linear-gradient(135deg, #10b981, #059669)', backgroundClip: 'text', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            {expenses.length}
          </div>
        </div>
      </div>

      {/* Filters & Controls */}
      <div className="glass-card" style={{ marginBottom: '30px', padding: '20px' }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div className="form-group" style={{ flex: 1, minWidth: '250px', marginBottom: 0 }}>
            <label className="form-label">Search</label>
            <input
              type="text"
              className="form-input"
              placeholder="Search by description or category..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>
          <div className="form-group" style={{ minWidth: '200px', marginBottom: 0 }}>
            <label className="form-label">Sort By</label>
            <select
              className="form-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
            >
              <option value="date-desc">Latest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="amount-desc">Highest Amount</option>
              <option value="amount-asc">Lowest Amount</option>
            </select>
          </div>
          <button className="btn btn-primary" onClick={() => refetch()} disabled={isFetching}>
            {isFetching ? '⏳ Refreshing…' : '🔄 Refresh'}
          </button>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="glass-card">
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#cbd5e1' }}>
            ⏳ Loading expenses...
          </div>
        ) : isError ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#fca5a5' }}>
            ⚠️ {getErrorMessage(error)}
            <div style={{ marginTop: '16px' }}>
              <button className="btn btn-secondary" onClick={() => refetch()}>Try Again</button>
            </div>
          </div>
        ) : sortedExpenses.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#cbd5e1' }}>
            📭 No expenses found
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>📝 Description</th>
                  <th>📂 Category</th>
                  <th>💰 Amount</th>
                  <th>📅 Date</th>
                  <th>⚙️ Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedExpenses.map((expense) => (
                  <tr key={expense._id} style={{ cursor: 'pointer' }} onClick={() => openView(expense)}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '1.3rem' }}>{getCategoryEmoji(expense.category)}</span>
                        <span style={{ fontWeight: '500' }}>{expense.description}</span>
                      </div>
                    </td>
                    <td>
                      <span style={{
                        background: 'rgba(102, 126, 234, 0.1)',
                        color: '#667eea',
                        padding: '6px 12px',
                        borderRadius: '8px',
                        fontWeight: '600',
                        fontSize: '0.85rem'
                      }}>
                        {expense.category}
                      </span>
                    </td>
                    <td style={{ fontWeight: '600', fontSize: '1.05rem', background: 'linear-gradient(135deg, #667eea, #06b6d4)', backgroundClip: 'text', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                      {formatCurrency(expense.amount)}
                    </td>
                    <td style={{ color: '#cbd5e1' }}>{formatDate(expense.date)}</td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                          onClick={() => openEdit(expense)}
                        >
                          ✏️ Edit
                        </button>
                        <button
                          className="btn btn-danger"
                          style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                          onClick={() => openDeleteConfirm(expense)}
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Button */}
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
        ➕ Add Expense
      </button>

      {/* View / Edit / Create Modal */}
      <ExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={closeExpenseModal}
        expense={selectedExpense}
        familyId={familyId}
        initialMode={modalMode}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!expenseToDelete}
        onClose={closeDeleteConfirm}
        onConfirm={handleConfirmDelete}
        title="Delete Expense?"
        tone="danger"
        confirmLabel="🗑️ Delete"
        isLoading={deleteExpense.isPending}
        error={deleteError}
        message={
          expenseToDelete ? (
            <>
              Are you sure you want to delete <strong>"{expenseToDelete.description}"</strong> (
              {formatCurrency(expenseToDelete.amount)})? This action cannot be undone.
            </>
          ) : (
            ''
          )
        }
      />
    </AdvancedLayout>
  );
}
