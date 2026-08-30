import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuthStore } from '../stores/authStore';
import { DashboardSummary } from '../types';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [trends, setTrends] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const user = useAuthStore((state) => state.user);
  const familyId = useAuthStore((state) => state.familyId);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  useEffect(() => {
    if (!familyId) return;
    fetchData();
  }, [familyId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [summaryRes, trendsRes] = await Promise.all([
        api.get(`/analytics/${familyId}/summary`),
        api.get(`/analytics/${familyId}/trends?months=6`),
      ]);

      setSummary(summaryRes.data.data);
      setTrends(trendsRes.data.data);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    navigate('/login');
  };

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">💰 Dashboard</h1>
            <p className="text-gray-600">Welcome back, {user?.name}!</p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => navigate('/expenses')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              + Add Expense
            </button>
            <button
              onClick={() => navigate('/settings')}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
            >
              Settings
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-4">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg">{error}</div>
        )}

        {loading ? (
          <div className="flex justify-center items-center h-96">
            <div className="text-gray-600">Loading dashboard...</div>
          </div>
        ) : summary ? (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-gray-600 text-sm font-medium">Total Spent (This Month)</h3>
                <p className="text-3xl font-bold text-gray-900 mt-2">₹{summary.totalSpent.toLocaleString()}</p>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-gray-600 text-sm font-medium">Average Daily</h3>
                <p className="text-3xl font-bold text-gray-900 mt-2">₹{summary.averageDaily.toFixed(0)}</p>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-gray-600 text-sm font-medium">Comparison (vs Last Month)</h3>
                <p className={`text-3xl font-bold mt-2 ${parseFloat(summary.comparison) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {parseFloat(summary.comparison) > 0 ? '+' : ''}{summary.comparison}%
                </p>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-gray-600 text-sm font-medium">Transactions</h3>
                <p className="text-3xl font-bold text-gray-900 mt-2">{summary.transactionCount}</p>
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Trends Chart */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Monthly Trends</h2>
                {trends.length > 0 && (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={trends}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value) => `₹${value}`} />
                      <Legend />
                      <Line type="monotone" dataKey="total" stroke="#3B82F6" name="Spent" />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Category Breakdown */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Category Breakdown</h2>
                {summary.categoryBreakdown.length > 0 && (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={summary.categoryBreakdown}
                        dataKey="total"
                        nameKey="category"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label
                      >
                        {summary.categoryBreakdown.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `₹${value}`} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
              <button
                onClick={() => navigate('/expenses')}
                className="bg-blue-600 text-white p-6 rounded-lg hover:bg-blue-700 transition text-center"
              >
                <div className="text-3xl mb-2">📊</div>
                <div className="font-semibold">View Expenses</div>
              </button>
              <button
                onClick={() => navigate('/family')}
                className="bg-green-600 text-white p-6 rounded-lg hover:bg-green-700 transition text-center"
              >
                <div className="text-3xl mb-2">👨‍👩‍👧‍👦</div>
                <div className="font-semibold">Family Settings</div>
              </button>
              <button
                onClick={() => navigate('/analytics')}
                className="bg-purple-600 text-white p-6 rounded-lg hover:bg-purple-700 transition text-center"
              >
                <div className="text-3xl mb-2">📈</div>
                <div className="font-semibold">Analytics</div>
              </button>
            </div>
          </>
        ) : null}
      </main>
    </div>
  );
}
