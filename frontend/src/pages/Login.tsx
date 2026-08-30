import { useState } from 'react';
import api from '../services/api';
import { useAuthStore } from '../stores/authStore';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data } = await api.post('/auth/login', { email, password });

      localStorage.setItem('accessToken', data.data.tokens.accessToken);
      localStorage.setItem('refreshToken', data.data.tokens.refreshToken);

      setAuth(
        data.data.user,
        data.data.tokens.accessToken,
        data.data.tokens.refreshToken,
        'default-family'
      );
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-yellow-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-amber-100 to-transparent rounded-full opacity-20 -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-br from-yellow-100 to-transparent rounded-full opacity-20 translate-x-1/2 translate-y-1/2"></div>

      <div className="max-w-md w-full space-y-8 relative z-10">
        {/* Header Section */}
        <div className="text-center animate-fadeIn">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-gold rounded-2xl mb-6 shadow-lg transform hover:-translate-y-1 transition-all duration-300">
            <span className="text-5xl">💰</span>
          </div>
          <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-yellow-500 mb-2">
            Expense Tracker
          </h1>
          <p className="text-lg text-amber-700 font-semibold">Smart Family Finance</p>
          <p className="text-sm text-amber-600 mt-1">Manage spending together, beautifully</p>
        </div>

        {/* Login Card */}
        <div className="card card-gold shadow-xl animate-slideInUp">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-amber-900 text-center">Welcome Back</h2>
            <p className="text-center text-amber-700 text-sm mt-2">Sign in to your account</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border-2 border-red-300 text-red-800 rounded-xl text-sm font-semibold animate-slideInDown">
              ❌ {error}
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-bold text-amber-900 mb-2">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full px-4 py-3 border-2 border-amber-200 rounded-lg text-amber-900 placeholder-amber-400 focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition-all duration-300 bg-white/70 hover:bg-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-amber-900 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 border-2 border-amber-200 rounded-lg text-amber-900 placeholder-amber-400 focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition-all duration-300 bg-white/70 hover:bg-white"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-yellow-500 text-white font-bold rounded-lg shadow-lg hover:shadow-xl hover:-translate-y-1 focus:outline-none focus:ring-4 focus:ring-amber-300 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-300 text-lg"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="spinner w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Signing in...
                </span>
              ) : (
                '✨ Sign In'
              )}
            </button>
          </form>

          {/* Sign Up Link */}
          <div className="mt-6 pt-6 border-t-2 border-amber-200 text-center">
            <p className="text-amber-900">
              Don't have an account?{' '}
              <a href="/signup" className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-yellow-500 hover:underline transition-all">
                Create one now
              </a>
            </p>
          </div>

          {/* Demo Credentials */}
          <div className="mt-6 p-4 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl border-2 border-amber-200 backdrop-blur">
            <p className="text-xs font-bold text-amber-900 mb-3 flex items-center gap-2">
              🔓 Demo Credentials
            </p>
            <div className="space-y-1 text-xs text-amber-800 font-medium">
              <p>📧 Email: <code className="bg-white px-2 py-1 rounded font-mono">demo@example.com</code></p>
              <p>🔐 Password: <code className="bg-white px-2 py-1 rounded font-mono">password123</code></p>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="grid grid-cols-3 gap-4 animate-slideInUp" style={{ animationDelay: '0.2s' }}>
          <div className="text-center p-4 bg-white/70 backdrop-blur rounded-xl border border-amber-200 hover:border-amber-400 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
            <div className="text-3xl mb-2">📊</div>
            <p className="text-xs font-semibold text-amber-900">Track</p>
            <p className="text-xs text-amber-700">Expenses</p>
          </div>
          <div className="text-center p-4 bg-white/70 backdrop-blur rounded-xl border border-amber-200 hover:border-amber-400 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
            <div className="text-3xl mb-2">👥</div>
            <p className="text-xs font-semibold text-amber-900">Share</p>
            <p className="text-xs text-amber-700">With Family</p>
          </div>
          <div className="text-center p-4 bg-white/70 backdrop-blur rounded-xl border border-amber-200 hover:border-amber-400 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
            <div className="text-3xl mb-2">📈</div>
            <p className="text-xs font-semibold text-amber-900">Analyze</p>
            <p className="text-xs text-amber-700">Spending</p>
          </div>
        </div>
      </div>
    </div>
  );
}
