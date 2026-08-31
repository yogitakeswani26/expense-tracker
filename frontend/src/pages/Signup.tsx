import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuthStore } from '../stores/authStore';
import '../styles/global-advanced.css';

export default function Signup() {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [passwordStrength, setPasswordStrength] = useState(0);
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const calculatePasswordStrength = (pwd: string) => {
    let strength = 0;
    if (pwd.length >= 6) strength++;
    if (pwd.length >= 8) strength++;
    if (/[A-Z]/.test(pwd)) strength++;
    if (/[0-9]/.test(pwd)) strength++;
    if (/[^A-Za-z0-9]/.test(pwd)) strength++;
    return strength;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (name === 'password') {
      setPasswordStrength(calculatePasswordStrength(value));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.name.trim()) {
      setError('Full name is required');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const { data } = await api.post('/auth/signup', {
        name: formData.name,
        email: formData.email,
        password: formData.password,
      });

      setSuccess('Account created! Redirecting...');

      setAuth(
        data.data.user,
        data.data.tokens.accessToken,
        data.data.tokens.refreshToken,
        data.data.user.familyId
      );

      requestAnimationFrame(() => {
        navigate('/dashboard');
      });
    } catch (err: any) {
      const errorMsg = err.response?.data?.error?.message || 'Signup failed';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const getStrengthColor = (strength: number) => {
    if (strength <= 1) return '#ef4444';
    if (strength <= 2) return '#f59e0b';
    if (strength <= 3) return '#eab308';
    return '#10b981';
  };

  const getStrengthLabel = (strength: number) => {
    if (strength === 0) return 'Very Weak';
    if (strength <= 1) return 'Weak';
    if (strength <= 2) return 'Fair';
    if (strength <= 3) return 'Good';
    return 'Strong';
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
        maxWidth: '480px',
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
          <p style={{ fontSize: '1.1rem', color: '#cbd5e1', fontWeight: '600' }}>Create Your Account</p>
          <p style={{ fontSize: '0.95rem', color: '#94a3b8', marginTop: '8px' }}>Join thousands managing family finances</p>
        </div>

        {/* Signup Card */}
        <div className="glass-card" style={{ padding: '40px' }}>
          <div style={{ marginBottom: '30px' }}>
            <h2 style={{ fontSize: '1.8rem', fontWeight: '800', color: '#ffffff', textAlign: 'center', marginBottom: '8px' }}>
              Get Started
            </h2>
            <p style={{ textAlign: 'center', color: '#94a3b8' }}>Create your account to start tracking</p>
          </div>

          {success && (
            <div style={{
              marginBottom: '20px',
              padding: '16px',
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '12px',
              color: '#86efac',
              fontSize: '0.95rem',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <span style={{ fontSize: '1.2rem' }}>✅</span>
              {success}
            </div>
          )}

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
              <label className="form-label">Full Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="John Doe"
                className="form-input"
                required
              />
            </div>

            <div>
              <label className="form-label">Email Address</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="your@email.com"
                className="form-input"
                required
              />
            </div>

            <div>
              <label className="form-label">Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="form-input"
                required
              />
              {formData.password && (
                <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    flex: 1,
                    height: '4px',
                    background: 'rgba(255,255,255,0.1)',
                    borderRadius: '2px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      height: '100%',
                      width: `${(passwordStrength / 5) * 100}%`,
                      background: getStrengthColor(passwordStrength),
                      transition: 'width 0.3s'
                    }}></div>
                  </div>
                  <span style={{ fontSize: '0.85rem', color: getStrengthColor(passwordStrength), fontWeight: '600' }}>
                    {getStrengthLabel(passwordStrength)}
                  </span>
                </div>
              )}
            </div>

            <div>
              <label className="form-label">Confirm Password</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
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
                  Creating Account...
                </span>
              ) : (
                '✨ Create Account'
              )}
            </button>
          </form>

          <div style={{ marginTop: '24px', textAlign: 'center', paddingTop: '24px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <p style={{ color: '#94a3b8', fontSize: '0.95rem', marginBottom: '10px' }}>
              Already have an account?
            </p>
            <Link to="/login" style={{
              color: '#667eea',
              textDecoration: 'none',
              fontWeight: '700',
              fontSize: '1rem',
              transition: 'color 0.3s',
              display: 'inline-block'
            }} onMouseEnter={(e) => e.currentTarget.style.color = '#7c3aed'} onMouseLeave={(e) => e.currentTarget.style.color = '#667eea'}>
              Sign In Instead →
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
