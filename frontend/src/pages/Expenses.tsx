import { useEffect, useMemo, useState, useRef } from 'react';
import api from '../services/api';
import { useAuthStore } from '../stores/authStore';
import { Expense, ExpenseFilters } from '../types';
import CategorySelector from '../components/CategorySelector';
import AdvancedFilters from '../components/AdvancedFilters';
import { createEmptyFilters, filterExpenses } from '../utils/expenseFilters';

interface CategoryData {
  _id: string;
  name: string;
  emoji: string;
  level: 1 | 2 | 3;
  children?: CategoryData[];
}

export default function Expenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [allCategories, setAllCategories] = useState<CategoryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showCategorySelector, setShowCategorySelector] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedCategoryName, setSelectedCategoryName] = useState('');
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    categoryId: '',
    tags: '',
    date: new Date().toISOString().split('T')[0],
  });
  const [error, setError] = useState('');
  const [filters, setFilters] = useState<ExpenseFilters>(createEmptyFilters());
  const isMountedRef = useRef(true);

  const familyId = useAuthStore((state) => state.familyId);

  // Distinct category names actually present in the loaded expenses,
  // used to populate the AdvancedFilters category checklist.
  const categoryOptions = useMemo(
    () => Array.from(new Set(expenses.map((e) => e.category).filter(Boolean))).sort((a, b) => a.localeCompare(b)),
    [expenses]
  );

  // Client-side filtering keeps this in sync without requiring backend
  // support for multi-category / multi-payment-method query params.
  const filteredExpenses = useMemo(() => filterExpenses(expenses, filters), [expenses, filters]);

  useEffect(() => {
    isMountedRef.current = true;

    if (familyId) {
      fetchExpenses();
      fetchCategories();
    }

    // CRITICAL: Cleanup on unmount to prevent state updates
    return () => {
      isMountedRef.current = false;
    };
  }, [familyId]);

  const fetchExpenses = async () => {
    try {
      const res = await api.get(`/expenses/${familyId}`);
      if (!isMountedRef.current) return;
      const { expenses = [] } = res.data.data;
      setError('');
      setExpenses(Array.isArray(expenses) ? expenses : []);
    } catch (err: any) {
      if (!isMountedRef.current) return;
      const errorMsg = err.response?.data?.error?.message || 'Failed to load expenses';
      setError(errorMsg);
      console.error('Expenses error:', errorMsg);
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories');
      if (!isMountedRef.current) return;
      const categoriesData = res.data.data;
      setAllCategories(Array.isArray(categoriesData) ? categoriesData : []);
    } catch (err: any) {
      if (!isMountedRef.current) return;
      const errorMsg = err.response?.data?.error?.message || 'Failed to load categories';
      console.error('Categories error:', errorMsg);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.categoryId) {
      setError('Please select a category');
      return;
    }

    try {
      const payload = {
        description: formData.description,
        amount: parseFloat(formData.amount),
        categoryId: formData.categoryId,
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()) : [],
        date: new Date(formData.date),
      };

      if (editingId) {
        await api.put(`/expenses/${familyId}/${editingId}`, payload);
      } else {
        await api.post(`/expenses/${familyId}`, payload);
      }

      setFormData({ description: '', amount: '', categoryId: '', tags: '', date: new Date().toISOString().split('T')[0] });
      setSelectedCategoryName('');
      setEditingId(null);
      setShowModal(false);
      setShowCategorySelector(false);
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
    // CRITICAL: Check fields exist before accessing
    setFormData({
      description: expense.description || '',
      amount: (expense.amount || 0).toString(),
      categoryId: expense.categoryId || expense.category || '',
      tags: Array.isArray(expense.tags) ? expense.tags.join(', ') : '',
      date: expense.date ? new Date(expense.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    });
    setSelectedCategoryName(expense.category || '');
    setEditingId(expense._id);
    setShowModal(true);
  };

  const handleCategorySelect = (categoryId: string, categoryName: string) => {
    setFormData({ ...formData, categoryId });
    setSelectedCategoryName(categoryName);
    setShowCategorySelector(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">📊 Expenses</h1>
          <button
            onClick={() => {
              setEditingId(null);
              setFormData({ description: '', amount: '', categoryId: '', tags: '', date: new Date().toISOString().split('T')[0] });
              setSelectedCategoryName('');
              setShowModal(true);
            }}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            + Add Expense
          </button>
        </div>

        {error && <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg">{error}</div>}

        {!loading && expenses.length > 0 && (
          <AdvancedFilters
            filters={filters}
            onChange={setFilters}
            categoryOptions={categoryOptions}
            resultCount={filteredExpenses.length}
            totalCount={expenses.length}
            className="mb-6"
          />
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-96 overflow-y-auto">
              <h2 className="text-2xl font-bold mb-4">{editingId ? 'Edit Expense' : 'Add Expense'}</h2>

              {error && <div className="mb-3 p-2 bg-red-50 border border-red-200 text-red-700 rounded text-sm">{error}</div>}

              {!showCategorySelector ? (
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
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />

                  <button
                    type="button"
                    onClick={() => setShowCategorySelector(true)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-left bg-white hover:bg-blue-50 transition font-semibold"
                  >
                    {selectedCategoryName ? `✓ ${selectedCategoryName}` : '📁 Select Category'}
                  </button>

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
                      onClick={() => {
                        setShowModal(false);
                        setShowCategorySelector(false);
                      }}
                      className="flex-1 px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <CategorySelector
                  value={formData.categoryId}
                  onChange={handleCategorySelect}
                  onClose={() => setShowCategorySelector(false)}
                />
              )}
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
                ) : filteredExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-600">
                      No expenses match the selected filters.
                      <button
                        type="button"
                        onClick={() => setFilters(createEmptyFilters())}
                        className="ml-2 text-blue-600 hover:text-blue-800 font-semibold underline"
                      >
                        Clear filters
                      </button>
                    </td>
                  </tr>
                ) : (
                  filteredExpenses.map((expense) => (
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
