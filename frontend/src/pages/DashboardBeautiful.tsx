import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import api from '../services/api';
import './Dashboard.css';

interface DaySpending {
  date: string;
  amount: number;
  description: string;
  category: string;
}

interface DailyData {
  date: string;
  day: string;
  spending: number;
  isHighest?: boolean;
  isLowest?: boolean;
  transactions: Array<{
    description: string;
    amount: number;
    category: string;
  }>;
}

export default function DashboardBeautiful() {
  const [dailyData, setDailyData] = useState<DailyData[]>([]);
  const [selectedDate, setSelectedDate] = useState<DailyData | null>(null);
  const [monthStats, setMonthStats] = useState({
    totalSpent: 0,
    averageDaily: 0,
    comparison: 0,
    highestDay: 0,
    lowestDay: 0,
  });
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await api.get('/analytics/dashboard');
      const data = response.data.data;

      setMonthStats({
        totalSpent: data.totalSpent || 0,
        averageDaily: data.averageDaily || 0,
        comparison: parseFloat(data.comparison) || 0,
        highestDay: data.highestDay || 0,
        lowestDay: data.lowestDay || 0,
      });

      // Generate calendar data
      const today = new Date();
      const year = today.getFullYear();
      const month = today.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      const daysInMonth = lastDay.getDate();

      const days: DailyData[] = [];
      for (let i = 1; i <= daysInMonth; i++) {
        const date = new Date(year, month, i);
        const dateStr = date.toISOString().split('T')[0];
        days.push({
          date: dateStr,
          day: date.toLocaleDateString('en-US', { weekday: 'short' }),
          spending: Math.random() * 5000,
          transactions: [
            { description: 'Sample expense', amount: 500, category: 'Food' }
          ]
        });
      }

      setDailyData(days);
      generateChartData(days);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    }
  };

  const generateChartData = (days: DailyData[]) => {
    const grouped = days.reduce((acc: any, day) => {
      const week = Math.floor((new Date(day.date).getDate() - 1) / 7);
      if (!acc[week]) acc[week] = { week: `Week ${week + 1}`, spending: 0, days: 0 };
      acc[week].spending += day.spending;
      acc[week].days++;
      return acc;
    }, {});

    setChartData(Object.values(grouped));
  };

  const formatCurrency = (value: number) => `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

  return (
    <div className="dashboard-beautiful">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-content">
          <h1>💰 Smart Expense Dashboard</h1>
          <p>August 2026 • Full Month Overview</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card total-spent">
          <div className="stat-icon">💸</div>
          <div className="stat-content">
            <p className="stat-label">Total Spent</p>
            <h2>{formatCurrency(monthStats.totalSpent)}</h2>
            <span className="stat-detail">This month</span>
          </div>
        </div>

        <div className="stat-card daily-avg">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <p className="stat-label">Daily Average</p>
            <h2>{formatCurrency(monthStats.averageDaily)}</h2>
            <span className="stat-detail">Per day</span>
          </div>
        </div>

        <div className="stat-card comparison">
          <div className="stat-icon">{monthStats.comparison > 0 ? '📈' : '📉'}</div>
          <div className="stat-content">
            <p className="stat-label">vs Last Month</p>
            <h2>{monthStats.comparison > 0 ? '+' : ''}{monthStats.comparison.toFixed(1)}%</h2>
            <span className="stat-detail">{monthStats.comparison > 0 ? 'Higher' : 'Lower'}</span>
          </div>
        </div>

        <div className="stat-card highest">
          <div className="stat-icon">📍</div>
          <div className="stat-content">
            <p className="stat-label">Highest Day</p>
            <h2>{formatCurrency(monthStats.highestDay)}</h2>
            <span className="stat-detail">Peak spending</span>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="charts-section">
        {/* Line Chart */}
        <div className="chart-card">
          <h3>📈 Spending Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis dataKey="week" stroke="#666" />
              <YAxis stroke="#666" />
              <Tooltip contentStyle={{ backgroundColor: '#f5f5f5', border: 'none', borderRadius: '8px' }} />
              <Line
                type="monotone"
                dataKey="spending"
                stroke="#6366f1"
                strokeWidth={3}
                dot={{ fill: '#6366f1', r: 5 }}
                activeDot={{ r: 7 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Bar Chart */}
        <div className="chart-card">
          <h3>📊 Weekly Breakdown</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis dataKey="week" stroke="#666" />
              <YAxis stroke="#666" />
              <Tooltip contentStyle={{ backgroundColor: '#f5f5f5', border: 'none', borderRadius: '8px' }} />
              <Bar dataKey="spending" fill="#06b6d4" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Calendar View */}
      <div className="calendar-section">
        <h3>📅 Daily Spending Calendar</h3>
        <p className="calendar-subtitle">Hover over any day to see spending details</p>

        <div className="calendar-grid">
          {dailyData.map((day) => (
            <div
              key={day.date}
              className={`calendar-day ${selectedDate?.date === day.date ? 'selected' : ''}`}
              onMouseEnter={() => setSelectedDate(day)}
              onMouseLeave={() => setSelectedDate(null)}
              title={`${day.date}: ${formatCurrency(day.spending)}`}
            >
              <div className="day-number">{new Date(day.date).getDate()}</div>
              <div className="day-name">{day.day}</div>
              <div className="day-amount">{formatCurrency(day.spending)}</div>

              {selectedDate?.date === day.date && (
                <div className="day-details">
                  {day.transactions.map((tx, idx) => (
                    <div key={idx} className="transaction">
                      <span className="tx-desc">{tx.description}</span>
                      <span className="tx-cat">{tx.category}</span>
                      <span className="tx-amount">{formatCurrency(tx.amount)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Selected Day Details */}
      {selectedDate && (
        <div className="day-details-card">
          <h3>📍 Details for {selectedDate.date}</h3>
          <div className="details-content">
            <p className="total-label">Total Spending: <span className="total-amount">{formatCurrency(selectedDate.spending)}</span></p>
            <div className="transactions-list">
              <h4>Transactions:</h4>
              {selectedDate.transactions.map((tx, idx) => (
                <div key={idx} className="transaction-item">
                  <span className="tx-category" style={{ backgroundColor: getCategoryColor(tx.category) }}>
                    {tx.category}
                  </span>
                  <span className="tx-description">{tx.description}</span>
                  <span className="tx-value">{formatCurrency(tx.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    'Food': '#FF6B6B',
    'Transport': '#4ECDC4',
    'Entertainment': '#FFE66D',
    'Shopping': '#FF69B4',
    'Bills': '#95E1D3',
    'Health': '#A8E6CF',
    'Other': '#C7CEEA',
  };
  return colors[category] || '#6C63FF';
}
