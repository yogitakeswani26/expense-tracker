import { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuthStore } from '../stores/authStore';

export default function Settings() {
  const [formData, setFormData] = useState({
    name: '',
    currency: 'INR',
    language: 'en',
    timezone: 'Asia/Kolkata',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const user = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        currency: user.currency || 'INR',
        language: user.language || 'en',
        timezone: user.timezone || 'Asia/Kolkata',
      });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const { data } = await api.put('/auth/profile', formData);
      updateUser(data.data);
      setSuccess('Settings updated successfully!');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">⚙️ Settings</h1>

        <div className="bg-white rounded-lg shadow p-8">
          {error && <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg">{error}</div>}
          {success && <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-800 rounded-lg">{success}</div>}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Full Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Currency</label>
              <select
                name="currency"
                value={formData.currency}
                onChange={handleChange}
                className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="INR">₹ Indian Rupee (INR)</option>
                <option value="USD">$ US Dollar (USD)</option>
                <option value="EUR">€ Euro (EUR)</option>
                <option value="GBP">£ British Pound (GBP)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Language</label>
              <select
                name="language"
                value={formData.language}
                onChange={handleChange}
                className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="en">English</option>
                <option value="hi">Hindi</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Timezone</label>
              <select
                name="timezone"
                value={formData.timezone}
                onChange={handleChange}
                className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="Asia/Kolkata">Asia/Kolkata (India)</option>
                <option value="America/New_York">America/New_York (USA)</option>
                <option value="Europe/London">Europe/London (UK)</option>
                <option value="Asia/Dubai">Asia/Dubai (UAE)</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium transition"
            >
              {loading ? 'Saving...' : 'Save Settings'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
