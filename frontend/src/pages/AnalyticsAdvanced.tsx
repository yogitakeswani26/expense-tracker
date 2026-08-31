import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import api from '../services/api';
import AdvancedLayout from '../components/AdvancedLayout';
import '../styles/global-advanced.css';

export default function AnalyticsAdvanced() {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await api.get('/analytics/dashboard', {
        params: { timeRange }
      });
      setData(response.data.data);
    } catch (error: any) {
      console.error('Analytics fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AdvancedLayout>
        <div className="page-content" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: '2rem', marginBottom: '20px' }}>⏳</div>
          <p style={{ color: '#cbd5e1' }}>Loading analytics...</p>
        </div>
      </AdvancedLayout>
    );
  }

  return (
    <AdvancedLayout>
      <div className="page-content">
        {/* Page Header */}
        <div className="page-header">
          <h1>📊 Advanced Analytics</h1>
          <p>Comprehensive expense analysis and insights</p>
        </div>

        {/* Time Range Selector */}
        <div style={{ marginBottom: '30px', display: 'flex', gap: '12px' }}>
          {(['week', 'month', 'year'] as const).map(range => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              style={{
                padding: '10px 20px',
                background: timeRange === range
                  ? 'linear-gradient(135deg, #667eea, #764ba2)'
                  : 'rgba(45, 55, 72, 0.5)',
                border: `1px solid ${timeRange === range ? 'var(--primary)' : 'var(--border)'}`,
                borderRadius: '10px',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                fontWeight: '600',
                transition: 'all 0.3s ease'
              }}
            >
              {range.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Summary Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '30px'
        }}>
          <div className="glass-card">
            <p style={{ margin: '0 0 8px 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>💰 Total Spent</p>
            <div style={{
              fontSize: '2rem',
              fontWeight: '800',
              background: 'linear-gradient(135deg, #667eea, #06b6d4)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              ₹{data?.totalSpent || 0}
            </div>
          </div>

          <div className="glass-card">
            <p style={{ margin: '0 0 8px 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>📈 Average Daily</p>
            <div style={{
              fontSize: '2rem',
              fontWeight: '800',
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              ₹{data?.averageDaily || 0}
            </div>
          </div>

          <div className="glass-card">
            <p style={{ margin: '0 0 8px 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>📊 Transactions</p>
            <div style={{
              fontSize: '2rem',
              fontWeight: '800',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              {data?.transactionCount || 0}
            </div>
          </div>

          <div className="glass-card">
            <p style={{ margin: '0 0 8px 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>🎯 Categories</p>
            <div style={{
              fontSize: '2rem',
              fontWeight: '800',
              background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              {data?.categoryCount || 0}
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '24px', marginBottom: '30px' }}>
          {/* Trend Chart */}
          <div className="glass-card">
            <h3 style={{ margin: '0 0 20px 0', color: 'var(--text-primary)' }}>📈 Spending Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={data?.monthlyTrends || []}>
                <defs>
                  <linearGradient id="colorSpent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#667eea" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#667eea" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" />
                <XAxis dataKey="month" stroke="#718096" />
                <YAxis stroke="#718096" />
                <Tooltip contentStyle={{ backgroundColor: '#1a202c', border: '1px solid #4a5568' }} />
                <Area type="monotone" dataKey="spent" stroke="#667eea" fill="url(#colorSpent)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Category Breakdown */}
          <div className="glass-card">
            <h3 style={{ margin: '0 0 20px 0', color: 'var(--text-primary)' }}>🥧 Category Breakdown</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data?.categoryBreakdown || []}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ category, percentage }) => `${category} ${percentage}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="amount"
                >
                  {['#667eea', '#06b6d4', '#f59e0b', '#10b981'].map((color, idx) => (
                    <Cell key={`cell-${idx}`} fill={color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Daily Comparison */}
          <div className="glass-card">
            <h3 style={{ margin: '0 0 20px 0', color: 'var(--text-primary)' }}>📊 Daily Comparison</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data?.dailyBreakdown?.slice(-14) || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" />
                <XAxis dataKey="date" stroke="#718096" angle={-45} textAnchor="end" height={80} />
                <YAxis stroke="#718096" />
                <Tooltip contentStyle={{ backgroundColor: '#1a202c', border: '1px solid #4a5568' }} />
                <Bar dataKey="amount" fill="#667eea" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Top Expenses */}
          <div className="glass-card">
            <h3 style={{ margin: '0 0 20px 0', color: 'var(--text-primary)' }}>🏆 Top Expenses</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {(data?.topExpenses || []).slice(0, 5).map((expense: any, idx: number) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px',
                    background: 'rgba(45, 55, 72, 0.3)',
                    borderRadius: '8px'
                  }}
                >
                  <div>
                    <p style={{ margin: 0, fontWeight: '600' }}>{expense.description}</p>
                    <p style={{ margin: '4px 0 0 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                      {expense.category}
                    </p>
                  </div>
                  <span style={{ fontWeight: '700', color: 'var(--primary)' }}>₹{expense.amount}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Detailed Insights */}
        <div className="glass-card">
          <h3 style={{ margin: '0 0 20px 0', color: 'var(--text-primary)' }}>💡 Insights</h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
            <div style={{ padding: '16px', background: 'rgba(16, 185, 129, 0.05)', borderRadius: '10px', borderLeft: '4px solid #10b981' }}>
              <h4 style={{ margin: '0 0 8px 0', color: '#10b981' }}>✅ Best Category Control</h4>
              <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                {data?.bestCategory || 'No data'} is within budget
              </p>
            </div>

            <div style={{ padding: '16px', background: 'rgba(239, 68, 68, 0.05)', borderRadius: '10px', borderLeft: '4px solid #ef4444' }}>
              <h4 style={{ margin: '0 0 8px 0', color: '#ef4444' }}>⚠️ Over Budget</h4>
              <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                {data?.overBudgetCount || 0} categories exceeded limit
              </p>
            </div>

            <div style={{ padding: '16px', background: 'rgba(59, 130, 246, 0.05)', borderRadius: '10px', borderLeft: '4px solid #3b82f6' }}>
              <h4 style={{ margin: '0 0 8px 0', color: '#3b82f6' }}>📊 Trend</h4>
              <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                {data?.trendDirection === 'up' ? '📈 Increasing' : '📉 Decreasing'} expenses this period
              </p>
            </div>
          </div>
        </div>
      </div>
    </AdvancedLayout>
  );
}
