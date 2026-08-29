import { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuthStore } from '../stores/authStore';
import { Expense, Category } from '../types';

export default function Expenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category: 'Food',
    tags: '',
    date: new Date().toISOString().split('T')[0],
  });
  const [error, setError] = useState('');

  const familyId = useAuthStore((state) => state.familyId);

  useEffect(() => {
    if (familyId) {
      fetchExpenses();
      fetchCategories();
    }
  }, [familyId]);

  const fetchExpenses = async () => {
    try {
      const res = await api.get(`/expenses/${familyId}`);
      setExpenses(res.data.data.expenses || []);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to load expenses');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get(`/expenses/${familyId}/categories`);
      setCategories(res.data.data);
    } catch (err) {
      console.error('Failed to load categories');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const payload = {
        description: formData.description,
        amount: parseFloat(formData.amount),
        category: formData.category,
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()) : [],
        date: new Date(formData.date),
      };

      if (editingId) {
        await api.put(`/expenses/${familyId}/${editingId}`, payload);
      } else {
        await api.post(`/expenses/${familyId}`, payload);
      }

      setFormData({ description: '', amount: '', category: 'Food', tags: '', date: new Date().toISOString().split('T')[0] });
      setEditingId(null);
      setShowModal(false);
      fetchExpenses();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to save expense');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure?')) return;
    try {
      await api.delete(`/expenses/${familyId}/${id}`);
      fetchExpenses();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to delete expense');
    }
  };

  const handleEdit = (expense: Expense) => {
    setFormData({
      description: expense.description,
      amount: expense.amount.toString(),
      category: expense.category,
      tags: expense.tags.join(', '),
      date: new Date(expense.date).toISOString().split('T')[0],
    });
    setEditingId(expense._id);
    setShowModal(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">📊 Expenses</h1>
          <button
            onClick={() => {
              setEditingId(null);
              setFormData({ description: '', amount: '', category: 'Food', tags: '', date: new Date().toISOString().split('T')[0] });
              setShowModal(true);
            }}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            + Add Expense
          </button>
        </div>

        {error && <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg">{error}</div>}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h2 className="text-2xl font-bold mb-4">{editingId ? 'Edit Expense' : 'Add Expense'}</h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <input
                  type="text"
                  placeholder="Description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />

                <input
                  type="number"
                  placeholder="Amount (₹)"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />

                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat.name}>
                      {cat.icon} {cat.name}
                    </option>
                  ))}
                </select>

                <input
                  type="text"
                  placeholder="Tags (comma-separated)"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />

                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />

                <div className="flex gap-4">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Expenses List */}
        {loading ? (
          <div className="text-center py-12">Loading expenses...</div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Description</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Category</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Amount</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Date</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {expenses.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-600">
                      No expenses yet. Add one to get started!
                    </td>
                  </tr>
                ) : (
                  expenses.map((expense) => (
                    <tr key={expense._id} className="border-b hover:bg-gray-50">
                      <td className="px-6 py-3 text-sm">{expense.description}</td>
                      <td className="px-6 py-3 text-sm">{expense.category}</td>
                      <td className="px-6 py-3 text-sm font-semibold">₹{expense.amount.toLocaleString()}</td>
                      <td className="px-6 py-3 text-sm">{new Date(expense.date).toLocaleDateString()}</td>
                      <td className="px-6 py-3 text-sm space-x-2">
                        <button
                          onClick={() => handleEdit(expense)}
                          className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(expense._id)}
                          className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
