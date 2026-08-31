import React, { useState, useEffect } from 'react';
import api from '../services/api';
import AdvancedLayout from '../components/AdvancedLayout';
import { useToast } from '../contexts/ToastContext';
import '../styles/global-advanced.css';

interface Budget {
  _id: string;
  category: string;
  limit: number;
  spent: number;
  period: 'monthly' | 'yearly';
  createdAt: string;
}

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ category: '', limit: 0, period: 'monthly' });
  const { addToast } = useToast();

  useEffect(() => {
    fetchBudgets();
  }, []);

  const fetchBudgets = async () => {
    try {
      setLoading(true);
      const response = await api.get('/budgets');
      setBudgets(response.data.data || []);
    } catch (error: any) {
      addToast('Failed to load budgets', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBudget = async () => {
    if (!formData.category || formData.limit <= 0) {
      addToast('Please fill all fields', 'warning');
      return;
    }

    try {
      const response = await api.post('/budgets', formData);
      setBudgets([...budgets, response.data.data]);
      setFormData({ category: '', limit: 0, period: 'monthly' });
      setShowForm(false);
      addToast('Budget created successfully!', 'success');
    } catch (error: any) {
      addToast(error.response?.data?.error?.message || 'Failed to create budget', 'error');
    }
  };

  const handleDeleteBudget = async (id: string) => {
    try {
      await api.delete(`/budgets/${id}`);
      setBudgets(budgets.filter(b => b._id !== id));
      addToast('Budget deleted', 'success');
    } catch (error: any) {
      addToast('Failed to delete budget', 'error');
    }
  };

  const getProgressColor = (spent: number, limit: number) => {
    const percentage = (spent / limit) * 100;
    if (percentage > 100) return '#ef4444';
    if (percentage > 80) return '#f59e0b';
    if (percentage > 50) return '#06b6d4';
    return '#10b981';
  };

  const getProgressPercentage = (spent: number, limit: number) => {
    return Math.min((spent / limit) * 100, 100);
  };

  if (loading) {
    return (
      <AdvancedLayout>
        <div className="page-content" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <p style={{ color: '#cbd5e1' }}>Loading budgets...</p>
        </div>
      </AdvancedLayout>
    );
  }

  return (
    <AdvancedLayout>
      <div className="page-content">
        <div className="page-header">
          <h1>🎯 Budget Management</h1>
          <p>Set and track your spending budgets</p>
        </div>

        <div style={{ marginBottom: '30px' }}>
          <button
            className="btn btn-primary"
            onClick={() => setShowForm(!showForm)}
            style={{ marginBottom: showForm ? '20px' : 0 }}
          >
            {showForm ? '❌ Cancel' : '➕ Create Budget'}
          </button>

          {showForm && (
            <div className="glass-card" style={{ maxWidth: '500px' }}>
              <h3 style={{ margin: '0 0 20px 0', color: 'var(--text-primary)' }}>Create New Budget</h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g., Food, Entertainment"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Limit Amount (₹)</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="5000"
                    value={formData.limit}
                    onChange={(e) => setFormData({ ...formData, limit: parseFloat(e.target.value) })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Period</label>
                  <select
                    className="form-input"
                    value={formData.period}
                    onChange={(e) => setFormData({ ...formData, period: e.target.value as 'monthly' | 'yearly' })}
                  >
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>

                <button className="btn btn-primary" onClick={handleCreateBudget} style={{ width: '100%' }}>
                  Create Budget
                </button>
              </div>
            </div>
          )}
        </div>

        {budgets.length === 0 ? (
          <div className="glass-card" style={{ textAlign: 'center', padding: '60px 20px' }}>
            <p style={{ fontSize: '3rem', margin: '0 0 16px 0' }}>🎯</p>
            <h3 style={{ margin: '0 0 8px 0', color: 'var(--text-primary)' }}>No Budgets Yet</h3>
            <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Create your first budget to track spending</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
            {budgets.map(budget => {
              const percentage = getProgressPercentage(budget.spent, budget.limit);
              const color = getProgressColor(budget.spent, budget.limit);

              return (
                <div key={budget._id} className="glass-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
                    <div>
                      <h3 style={{ margin: '0 0 4px 0', color: 'var(--text-primary)' }}>{budget.category}</h3>
                      <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                        {budget.period === 'monthly' ? 'Monthly' : 'Yearly'}
                      </p>
                    </div>
                    <button
                      className="btn btn-danger"
                      onClick={() => handleDeleteBudget(budget._id)}
                      style={{ padding: '8px 12px', fontSize: '0.9rem' }}
                    >
                      🗑️
                    </button>
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '8px',
                      fontSize: '0.9rem'
                    }}>
                      <span style={{ color: 'var(--text-secondary)' }}>₹{budget.spent.toFixed(2)}</span>
                      <span style={{ color: 'var(--text-secondary)' }}>₹{budget.limit.toFixed(2)}</span>
                    </div>

                    <div style={{
                      width: '100%',
                      height: '8px',
                      background: 'rgba(102, 126, 234, 0.1)',
                      borderRadius: '4px',
                      overflow: 'hidden'
                    }}>
                      <div
                        style={{
                          width: `${percentage}%`,
                          height: '100%',
                          background: color,
                          transition: 'width 0.3s ease'
                        }}
                      />
                    </div>
                  </div>

                  <div style={{
                    padding: '12px',
                    background: 'rgba(102, 126, 234, 0.05)',
                    borderRadius: '8px',
                    textAlign: 'center'
                  }}>
                    <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700', color: color }}>
                      {percentage.toFixed(0)}%
                    </p>
                    <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      {budget.spent > budget.limit ? '❌ Over budget' : '✅ On track'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AdvancedLayout>
  );
}
