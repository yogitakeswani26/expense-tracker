import { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuthStore } from '../stores/authStore';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function Analytics() {
  const [budgets, setBudgets] = useState<any[]>([]);
  const [spending, setSpending] = useState<any[]>([]);
  const [trends, setTrends] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const familyId = useAuthStore((state) => state.familyId);

  useEffect(() => {
    if (familyId) fetchAnalytics();
  }, [familyId]);

  const fetchAnalytics = async () => {
    try {
      const [budgetsRes, spendingRes, trendsRes] = await Promise.all([
        api.get(`/analytics/${familyId}/budgets/status`),
        api.get(`/analytics/${familyId}/spending/comparison`),
        api.get(`/analytics/${familyId}/trends?months=12`),
      ]);

      setBudgets(budgetsRes.data.data);
      setSpending(spendingRes.data.data);
      setTrends(trendsRes.data.data);
    } catch (err) {
      console.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">📈 Analytics & Reports</h1>

        {loading ? (
          <div className="text-center py-12">Loading analytics...</div>
        ) : (
          <div className="space-y-8">
            {/* Budget Status */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold mb-6">💰 Budget Status</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {budgets.map((budget, idx) => (
                  <div key={idx} className="border rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-semibold">{budget.category}</h3>
                      <span className={`text-sm px-2 py-1 rounded ${
                        budget.status === 'exceeded' ? 'bg-red-100 text-red-800' :
                        budget.status === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {budget.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          budget.status === 'exceeded' ? 'bg-red-600' :
                          budget.status === 'warning' ? 'bg-yellow-600' :
                          'bg-green-600'
                        }`}
                        style={{ width: `${Math.min(budget.percentage, 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-sm mt-2">
                      <span>₹{budget.spent.toLocaleString()} / ₹{budget.limit.toLocaleString()}</span>
                      <span>{budget.percentage.toFixed(0)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Spending Comparison */}
            {spending.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-2xl font-bold mb-6">💳 Spending by Member</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={spending}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => `₹${value}`} />
                    <Bar dataKey="total" fill="#3B82F6" name="Amount Spent" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Trends */}
            {trends.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-2xl font-bold mb-6">📊 12-Month Trends</h2>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={trends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => `₹${value}`} />
                    <Legend />
                    <Line type="monotone" dataKey="total" stroke="#3B82F6" name="Spending" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
