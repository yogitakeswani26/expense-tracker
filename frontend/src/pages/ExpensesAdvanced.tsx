import React, { useState, useEffect } from 'react';
import api from '../services/api';
import AdvancedLayout from '../components/AdvancedLayout';
import '../styles/global-advanced.css';

interface Expense {
  _id: string;
  description: string;
  category: string;
  amount: number;
  date: string;
  paidBy?: string;
}

const categoryEmojis: Record<string, string> = {
  'Food': '🍔', 'Transport': '🚗', 'Entertainment': '🎬', 'Shopping': '🛍️',
  'Bills': '📄', 'Health': '🏥', 'Travel': '✈️', 'Education': '📚',
  'Netflix': '🎬', 'Uber': '🚗', 'Hotel & Accommodation': '🏨'
};

export default function ExpensesAdvanced() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [sortBy, setSortBy] = useState('date-desc');

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const response = await api.get('/expenses');
      setExpenses(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => `₹${value.toLocaleString('en-IN')}`;
  const formatDate = (date: string) => new Date(date).toLocaleDateString('en-IN');

  const sortedExpenses = [...expenses]
    .filter(e => e.description.toLowerCase().includes(filter.toLowerCase()) || e.category.toLowerCase().includes(filter.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'date-desc') return new Date(b.date).getTime() - new Date(a.date).getTime();
      if (sortBy === 'date-asc') return new Date(a.date).getTime() - new Date(b.date).getTime();
      if (sortBy === 'amount-desc') return b.amount - a.amount;
      if (sortBy === 'amount-asc') return a.amount - b.amount;
      return 0;
    });

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const averageExpense = expenses.length > 0 ? totalExpenses / expenses.length : 0;

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
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="date-desc">Latest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="amount-desc">Highest Amount</option>
              <option value="amount-asc">Lowest Amount</option>
            </select>
          </div>
          <button className="btn btn-primary" onClick={fetchExpenses}>
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="glass-card">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#cbd5e1' }}>
            ⏳ Loading expenses...
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
                  <tr key={expense._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '1.3rem' }}>{categoryEmojis[expense.category] || '💳'}</span>
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
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn btn-secondary" style={{ padding: '8px 12px', fontSize: '0.85rem' }}>
                          ✏️ Edit
                        </button>
                        <button className="btn btn-danger" style={{ padding: '8px 12px', fontSize: '0.85rem' }}>
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
      >
        ➕ Add Expense
      </button>
    </AdvancedLayout>
  );
}
