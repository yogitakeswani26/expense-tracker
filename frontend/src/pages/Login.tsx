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
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-purple-50 to-blue-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-gradient-to-br from-purple-300 to-transparent rounded-full opacity-20 -translate-x-1/2 -translate-y-1/2 animate-pulse"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-300 to-transparent rounded-full opacity-20 translate-x-1/2 translate-y-1/2 animate-pulse"></div>

      <div className="max-w-md w-full space-y-8 relative z-10">
        {/* Header */}
        <div className="text-center animate-fadeIn">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl mb-6 shadow-xl transform hover:scale-110 transition-transform duration-300">
            <span className="text-6xl">💳</span>
          </div>
          <h1 className="text-4xl font-bold text-gradient mb-2">ExpenseTracker</h1>
          <p className="text-lg text-slate-600 font-semibold">Smart Family Finance</p>
          <p className="text-sm text-slate-500 mt-2">Manage spending together, beautifully</p>
        </div>

        {/* Login Card */}
        <div className="card shadow-2xl animate-slideInUp">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-slate-800 text-center mb-2">Welcome Back</h2>
            <p className="text-center text-slate-500">Sign in to your account</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-300 text-red-700 rounded-xl text-sm font-semibold animate-slideInDown flex items-center gap-2">
              <span className="text-lg">❌</span> {error}
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all duration-300 bg-white/80 hover:bg-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all duration-300 bg-white/80 hover:bg-white"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold rounded-xl shadow-lg hover:shadow-2xl hover:-translate-y-1 focus:outline-none focus:ring-4 focus:ring-purple-300 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-300 text-lg relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Signing in...
                </span>
              ) : (
                '✨ Sign In'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="flex-1 h-px bg-gradient-to-r from-slate-200 to-transparent"></div>
            <span className="text-sm text-slate-500">or</span>
            <div className="flex-1 h-px bg-gradient-to-l from-slate-200 to-transparent"></div>
          </div>

          {/* Sign Up Link */}
          <p className="text-center text-slate-600">
            Don't have an account?{' '}
            <a href="/signup" className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600 hover:underline transition-all">
              Create one now
            </a>
          </p>

          {/* Demo Credentials */}
          <div className="mt-6 p-4 glass rounded-xl">
            <p className="text-xs font-bold text-slate-700 mb-3 flex items-center gap-2">
              🔓 Demo Credentials (for testing)
            </p>
            <div className="space-y-2 text-xs text-slate-600 font-medium">
              <div className="flex items-center justify-between bg-white/50 p-2 rounded-lg">
                <span>📧 Email:</span>
                <code className="bg-purple-100 text-purple-700 px-2 py-1 rounded font-mono">demo@example.com</code>
              </div>
              <div className="flex items-center justify-between bg-white/50 p-2 rounded-lg">
                <span>🔐 Password:</span>
                <code className="bg-purple-100 text-purple-700 px-2 py-1 rounded font-mono">password123</code>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="grid grid-cols-3 gap-4 animate-slideInUp" style={{ animationDelay: '0.2s' }}>
          <div className="group">
            <div className="card p-4 text-center h-full hover:bg-gradient-to-br hover:from-purple-50 hover:to-blue-50">
              <div className="text-4xl mb-3 group-hover:scale-125 transition-transform duration-300">📊</div>
              <p className="text-xs font-bold text-slate-800">Track</p>
              <p className="text-xs text-slate-600">Expenses</p>
            </div>
          </div>
          <div className="group">
            <div className="card p-4 text-center h-full hover:bg-gradient-to-br hover:from-purple-50 hover:to-blue-50">
              <div className="text-4xl mb-3 group-hover:scale-125 transition-transform duration-300">👥</div>
              <p className="text-xs font-bold text-slate-800">Share</p>
              <p className="text-xs text-slate-600">With Family</p>
            </div>
          </div>
          <div className="group">
            <div className="card p-4 text-center h-full hover:bg-gradient-to-br hover:from-purple-50 hover:to-blue-50">
              <div className="text-4xl mb-3 group-hover:scale-125 transition-transform duration-300">📈</div>
              <p className="text-xs font-bold text-slate-800">Analyze</p>
              <p className="text-xs text-slate-600">Spending</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
