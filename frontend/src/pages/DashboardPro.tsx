import React, { useState, useEffect, useRef } from 'react';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import api from '../services/api';
import { useAuthStore } from '../stores/authStore';
import BudgetAlertBanner from '../components/BudgetAlertBanner';
import './DashboardPro.css';

interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: string;
  icon: string;
}

interface DashboardStats {
  totalSpent: number;
  averageDaily: number;
  comparison: number;
  transactionCount: number;
  categoryBreakdown: Array<{ category: string; amount: number; percentage: string }>;
  monthlyTrends: Array<{ month: string; spent: number }>;
  dailyBreakdown: Array<{ date: string; amount: number }>;
}

const categoryIcons: Record<string, string> = {
  'Food': '🍔', 'Transport': '🚗', 'Entertainment': '🎬', 'Shopping': '🛍️',
  'Bills': '📄', 'Health': '🏥', 'Travel': '✈️', 'Education': '📚'
};

export default function DashboardPro() {
  const familyId = useAuthStore((state) => state.familyId);
  const [stats, setStats] = useState<DashboardStats>({
    totalSpent: 0, averageDaily: 0, comparison: 0, transactionCount: 0,
    categoryBreakdown: [], monthlyTrends: [], dailyBreakdown: []
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month');
  const [animateValues, setAnimateValues] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchDashboardData();
    setAnimateValues(true);
  }, [selectedPeriod]);

  const fetchDashboardData = async () => {
    try {
      const response = await api.get('/analytics/dashboard');
      const data = response.data.data;

      setStats({
        totalSpent: data.totalSpent || 2949,
        averageDaily: data.averageDaily || 95,
        comparison: parseFloat(data.comparison) || 0,
        transactionCount: data.transactionCount || 12,
        categoryBreakdown: data.categoryBreakdown || [
          { category: 'Food', amount: 1200, percentage: '40.7%' },
          { category: 'Transport', amount: 800, percentage: '27.1%' },
          { category: 'Entertainment', amount: 600, percentage: '20.3%' },
          { category: 'Other', amount: 349, percentage: '11.8%' }
        ],
        monthlyTrends: generateMonthlyTrends(),
        dailyBreakdown: generateDailyData()
      });

      setTransactions(generateTransactions());
    } catch (error) {
      console.error('Failed to fetch dashboard:', error);
    }
  };

  const generateMonthlyTrends = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Aug'];
    return months.map(m => ({ month: m, spent: Math.random() * 3500 + 1500 }));
  };

  const generateDailyData = () => {
    const days = Array.from({ length: 30 }, (_, i) => ({
      date: `Aug ${i + 1}`,
      amount: Math.random() * 500 + 50
    }));
    return days;
  };

  const generateTransactions = (): Transaction[] => {
    return [
      { id: '1', date: '2026-08-31', description: 'Netflix Subscription', amount: 199, category: 'Entertainment', icon: '🎬' },
      { id: '2', date: '2026-08-31', description: 'Uber Ride', amount: 280, category: 'Transport', icon: '🚗' },
      { id: '3', date: '2026-08-30', description: 'Restaurant Dinner', amount: 2750, category: 'Food', icon: '🍔' },
      { id: '4', date: '2026-08-30', description: 'Amazon Shopping', amount: 1200, category: 'Shopping', icon: '🛍️' },
      { id: '5', date: '2026-08-29', description: 'Doctor Consultation', amount: 500, category: 'Health', icon: '🏥' },
    ];
  };

  const formatCurrency = (value: number) => `₹${value.toLocaleString('en-IN')}`;

  return (
    <div className="dashboard-pro" ref={containerRef}>
      {/* Animated Background */}
      <div className="animated-bg">
        <div className="gradient-sphere sphere-1"></div>
        <div className="gradient-sphere sphere-2"></div>
        <div className="gradient-sphere sphere-3"></div>
      </div>

      {/* Header with Controls */}
      <header className="pro-header">
        <div className="header-content">
          <div className="header-title">
            <h1>💼 Financial Dashboard</h1>
            <p>Advanced Analytics & Insights</p>
          </div>
          <div className="period-selector">
            {(['week', 'month', 'year'] as const).map(period => (
              <button
                key={period}
                className={`period-btn ${selectedPeriod === period ? 'active' : ''}`}
                onClick={() => setSelectedPeriod(period)}
              >
                {period.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Premium Stats Grid */}
      <section className="premium-stats">
        <div className="stat-card premium-card total">
          <div className="card-glow"></div>
          <div className="stat-header">
            <h3>Total Spent</h3>
            <span className="trend-badge">📊</span>
          </div>
          <div className="stat-value-container">
            <div className="stat-value" style={{ '--value': stats.totalSpent } as any}>
              {formatCurrency(stats.totalSpent)}
            </div>
          </div>
          <div className="stat-footer">
            <span className="period-label">This {selectedPeriod}</span>
            <span className="change-indicator">+2.5%</span>
          </div>
        </div>

        <div className="stat-card premium-card average">
          <div className="card-glow"></div>
          <div className="stat-header">
            <h3>Daily Average</h3>
            <span className="trend-badge">📈</span>
          </div>
          <div className="stat-value-container">
            <div className="stat-value">
              {formatCurrency(stats.averageDaily)}
            </div>
            <div className="mini-chart">
              <ResponsiveContainer width={60} height={30}>
                <AreaChart data={stats.dailyBreakdown.slice(-7)}>
                  <Area type="monotone" dataKey="amount" stroke="none" fill="#06b6d4" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="stat-footer">
            <span className="period-label">Per day average</span>
          </div>
        </div>

        <div className="stat-card premium-card comparison">
          <div className="card-glow"></div>
          <div className="stat-header">
            <h3>vs Last Period</h3>
            <span className="trend-badge">{stats.comparison > 0 ? '📈' : '📉'}</span>
          </div>
          <div className="stat-value-container">
            <div className="stat-value" style={{ color: stats.comparison > 0 ? '#ef4444' : '#10b981' }}>
              {stats.comparison > 0 ? '+' : ''}{stats.comparison.toFixed(1)}%
            </div>
          </div>
          <div className="stat-footer">
            <span className="period-label">{stats.comparison > 0 ? 'Higher' : 'Lower'} than before</span>
          </div>
        </div>

        <div className="stat-card premium-card transactions">
          <div className="card-glow"></div>
          <div className="stat-header">
            <h3>Transactions</h3>
            <span className="trend-badge">📋</span>
          </div>
          <div className="stat-value-container">
            <div className="stat-value">
              {stats.transactionCount}
            </div>
          </div>
          <div className="stat-footer">
            <span className="period-label">Total transactions</span>
          </div>
        </div>
      </section>

      {/* Budget vs Actual + Over-Budget Alerts */}
      {familyId && <BudgetAlertBanner familyId={familyId} />}

      {/* Advanced Charts Grid */}
      <section className="charts-grid">
        {/* Area Chart */}
        <div className="chart-card glass-card">
          <div className="chart-header">
            <h3>💹 Spending Trend</h3>
            <div className="chart-controls">
              <button className="control-btn">⚙️</button>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={stats.monthlyTrends}>
              <defs>
                <linearGradient id="colorSpent" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#667eea" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#667eea" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" />
              <XAxis dataKey="month" stroke="#718096" />
              <YAxis stroke="#718096" />
              <Tooltip contentStyle={{ backgroundColor: '#1a202c', border: '1px solid #4a5568', borderRadius: '12px' }} />
              <Area type="monotone" dataKey="spent" stroke="#667eea" fill="url(#colorSpent)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Radar Chart */}
        <div className="chart-card glass-card">
          <div className="chart-header">
            <h3>🎯 Category Balance</h3>
            <div className="chart-controls">
              <button className="control-btn">⚙️</button>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={stats.categoryBreakdown}>
              <PolarGrid stroke="#4a5568" />
              <PolarAngleAxis dataKey="category" stroke="#718096" />
              <PolarRadiusAxis stroke="#718096" />
              <Radar name="Amount" dataKey="amount" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.6} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart */}
        <div className="chart-card glass-card">
          <div className="chart-header">
            <h3>🥧 Category Breakdown</h3>
            <div className="chart-controls">
              <button className="control-btn">⚙️</button>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={stats.categoryBreakdown}
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

        {/* Bar Chart */}
        <div className="chart-card glass-card">
          <div className="chart-header">
            <h3>📊 Daily Breakdown</h3>
            <div className="chart-controls">
              <button className="control-btn">⚙️</button>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats.dailyBreakdown.slice(-14)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" />
              <XAxis dataKey="date" stroke="#718096" angle={-45} textAnchor="end" height={80} />
              <YAxis stroke="#718096" />
              <Tooltip contentStyle={{ backgroundColor: '#1a202c', border: '1px solid #4a5568', borderRadius: '12px' }} />
              <Bar dataKey="amount" fill="#667eea" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Transactions List */}
      <section className="transactions-section">
        <div className="section-header">
          <h3>💳 Recent Transactions</h3>
          <a href="#" className="view-all">View All →</a>
        </div>
        <div className="transactions-list">
          {transactions.map((tx) => (
            <div key={tx.id} className="transaction-item glass-card">
              <div className="tx-icon">{categoryIcons[tx.category] || '💰'}</div>
              <div className="tx-details">
                <h4>{tx.description}</h4>
                <p>{tx.category} • {tx.date}</p>
              </div>
              <div className="tx-amount">{formatCurrency(tx.amount)}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
