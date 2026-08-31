import { useState } from 'react';
import api from '../services/api';
import { useAuthStore } from '../stores/authStore';
import { useNavigate, Link } from 'react-router-dom';
import '../styles/global-advanced.css';

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

      setAuth(
        data.data.user,
        data.data.tokens.accessToken,
        data.data.tokens.refreshToken,
        data.data.user.familyId
      );
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Animated Background Gradients */}
      <div style={{
        position: 'absolute',
        top: '-50%',
        left: '-50%',
        width: '100%',
        height: '100%',
        background: 'radial-gradient(circle, rgba(99, 102, 241, 0.1) 0%, transparent 70%)',
        animation: 'float 20s infinite ease-in-out'
      }}></div>
      <div style={{
        position: 'absolute',
        bottom: '-50%',
        right: '-50%',
        width: '100%',
        height: '100%',
        background: 'radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%)',
        animation: 'float 25s infinite ease-in-out'
      }}></div>

      <div style={{
        maxWidth: '420px',
        width: '100%',
        position: 'relative',
        zIndex: 10
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '80px',
            height: '80px',
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(59, 130, 246, 0.2) 100%)',
            borderRadius: '20px',
            marginBottom: '20px',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            fontSize: '3rem'
          }}>
            💰
          </div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: '900', color: '#ffffff', marginBottom: '8px' }}>
            ExpenseTracker
          </h1>
          <p style={{ fontSize: '1.1rem', color: '#cbd5e1', fontWeight: '600' }}>Smart Family Finance</p>
          <p style={{ fontSize: '0.95rem', color: '#94a3b8', marginTop: '8px' }}>Manage spending together, beautifully</p>
        </div>

        {/* Login Card */}
        <div className="glass-card" style={{ padding: '40px' }}>
          <div style={{ marginBottom: '30px' }}>
            <h2 style={{ fontSize: '1.8rem', fontWeight: '800', color: '#ffffff', textAlign: 'center', marginBottom: '8px' }}>
              Welcome Back
            </h2>
            <p style={{ textAlign: 'center', color: '#94a3b8' }}>Sign in to your account</p>
          </div>

          {error && (
            <div style={{
              marginBottom: '20px',
              padding: '16px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '12px',
              color: '#fca5a5',
              fontSize: '0.95rem',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <span style={{ fontSize: '1.2rem' }}>❌</span>
              {error}
            </div>
          )}

          <form style={{ display: 'flex', flexDirection: 'column', gap: '20px' }} onSubmit={handleSubmit}>
            <div>
              <label className="form-label">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="form-input"
                required
              />
            </div>

            <div>
              <label className="form-label">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="form-input"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{
                width: '100%',
                marginTop: '10px',
                opacity: loading ? 0.7 : 1,
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <div style={{
                    width: '18px',
                    height: '18px',
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTop: '2px solid white',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite'
                  }}></div>
                  Signing in...
                </span>
              ) : (
                '🔓 Sign In'
              )}
            </button>
          </form>

          <div style={{ marginTop: '24px', textAlign: 'center', paddingTop: '24px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <p style={{ color: '#94a3b8', fontSize: '0.95rem', marginBottom: '10px' }}>
              Don't have an account?
            </p>
            <Link to="/signup" style={{
              color: '#667eea',
              textDecoration: 'none',
              fontWeight: '700',
              fontSize: '1rem',
              transition: 'color 0.3s',
              display: 'inline-block'
            }} onMouseEnter={(e) => e.currentTarget.style.color = '#7c3aed'} onMouseLeave={(e) => e.currentTarget.style.color = '#667eea'}>
              Create Account →
            </Link>
          </div>
        </div>

        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(30px); }
          }
        `}</style>
      </div>
    </div>
  );
}
