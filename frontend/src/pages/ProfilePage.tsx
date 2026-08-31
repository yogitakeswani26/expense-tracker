import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import AdvancedLayout from '../components/AdvancedLayout';
import '../styles/global-advanced.css';
import api from '../services/api';

interface UserProfile {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  dateOfBirth?: string;
  address?: string;
  city?: string;
  country?: string;
  currency: string;
  timezone: string;
  preferences?: {
    theme: 'dark' | 'light';
    notifications: boolean;
    emailDigest: 'daily' | 'weekly' | 'monthly' | 'never';
    language: string;
  };
  twoFactorEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function ProfilePage() {
  const { user, logout, updateUser } = useAuthStore();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<'personal' | 'security' | 'preferences'>('personal');
  const [formData, setFormData] = useState<Partial<UserProfile>>({});
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [twoFactorModal, setTwoFactorModal] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await api.get('/auth/profile');
      setProfile(response.data.data);
      setFormData(response.data.data);
    } catch (error: any) {
      setMessage({ type: 'error', text: 'Failed to load profile' });
      console.error('Profile fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      const response = await api.put('/auth/profile', formData);
      setProfile(response.data.data);
      setEditing(false);
      setMessage({ type: 'success', text: 'Profile updated successfully' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.error?.message || 'Failed to update profile' });
    }
  };

  const handlePasswordChange = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }

    try {
      await api.post('/auth/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setMessage({ type: 'success', text: 'Password changed successfully' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.error?.message || 'Failed to change password' });
    }
  };

  const handleTwoFactorToggle = async () => {
    try {
      await api.post('/auth/2fa/toggle', {
        enable: !profile?.twoFactorEnabled
      });
      setProfile(prev => prev ? { ...prev, twoFactorEnabled: !prev.twoFactorEnabled } : null);
      setMessage({ type: 'success', text: `2FA ${!profile?.twoFactorEnabled ? 'enabled' : 'disabled'}` });
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      setMessage({ type: 'error', text: 'Failed to update 2FA settings' });
    }
  };

  if (loading) {
    return (
      <AdvancedLayout>
        <div className="page-content" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: '2rem', marginBottom: '20px' }}>⏳</div>
          <p style={{ color: '#cbd5e1' }}>Loading your profile...</p>
        </div>
      </AdvancedLayout>
    );
  }

  return (
    <AdvancedLayout>
      <div className="page-content">
        {/* Page Header */}
        <div className="page-header">
          <h1>👤 My Profile</h1>
          <p>Manage your account settings and preferences</p>
        </div>

        {/* Message Alert */}
        {message && (
          <div style={{
            padding: '16px',
            borderRadius: '12px',
            marginBottom: '24px',
            background: message.type === 'success'
              ? 'rgba(16, 185, 129, 0.1)'
              : 'rgba(239, 68, 68, 0.1)',
            border: `1px solid ${message.type === 'success' ? '#10b981' : '#ef4444'}`,
            color: message.type === 'success' ? '#10b981' : '#ef4444'
          }}>
            {message.type === 'success' ? '✅' : '❌'} {message.text}
          </div>
        )}

        {/* Tabs */}
        <div style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '30px',
          borderBottom: '1px solid var(--border)',
          paddingBottom: '16px'
        }}>
          {(['personal', 'security', 'preferences'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '12px 20px',
                border: 'none',
                background: 'transparent',
                color: activeTab === tab ? 'var(--primary)' : 'var(--text-secondary)',
                borderBottom: activeTab === tab ? `2px solid var(--primary)` : 'none',
                cursor: 'pointer',
                fontWeight: activeTab === tab ? '600' : '500',
                transition: 'all 0.3s ease'
              }}
            >
              {tab === 'personal' && '👤 Personal'}
              {tab === 'security' && '🔒 Security'}
              {tab === 'preferences' && '⚙️ Preferences'}
            </button>
          ))}
        </div>

        {/* PERSONAL TAB */}
        {activeTab === 'personal' && (
          <div className="glass-card" style={{ maxWidth: '600px' }}>
            <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #667eea, #06b6d4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2.5rem'
              }}>
                {profile?.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 style={{ margin: 0, marginBottom: '4px', color: 'var(--text-primary)' }}>
                  {profile?.name}
                </h3>
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  {profile?.email}
                </p>
              </div>
            </div>

            {editing ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input
                    type="tel"
                    className="form-input"
                    value={formData.phone || ''}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Date of Birth</label>
                  <input
                    type="date"
                    className="form-input"
                    value={formData.dateOfBirth?.split('T')[0] || ''}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Address</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.address || ''}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">City</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.city || ''}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Country</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.country || ''}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Currency</label>
                  <select
                    className="form-input"
                    value={formData.currency || 'INR'}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  >
                    <option value="INR">₹ Indian Rupee</option>
                    <option value="USD">$ US Dollar</option>
                    <option value="EUR">€ Euro</option>
                    <option value="GBP">£ British Pound</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Timezone</label>
                  <select
                    className="form-input"
                    value={formData.timezone || 'Asia/Kolkata'}
                    onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                  >
                    <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">America/New_York (EST)</option>
                  </select>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                  <button className="btn btn-primary" onClick={handleUpdateProfile}>
                    💾 Save Changes
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={() => {
                      setEditing(false);
                      setFormData(profile || {});
                    }}
                  >
                    ❌ Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ padding: '12px', background: 'rgba(102, 126, 234, 0.05)', borderRadius: '8px' }}>
                  <p style={{ margin: '0 0 4px 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Email</p>
                  <p style={{ margin: 0, fontSize: '1.05rem', fontWeight: '500' }}>{profile?.email}</p>
                </div>

                {profile?.phone && (
                  <div style={{ padding: '12px', background: 'rgba(102, 126, 234, 0.05)', borderRadius: '8px' }}>
                    <p style={{ margin: '0 0 4px 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Phone</p>
                    <p style={{ margin: 0, fontSize: '1.05rem', fontWeight: '500' }}>{profile.phone}</p>
                  </div>
                )}

                {profile?.address && (
                  <div style={{ padding: '12px', background: 'rgba(102, 126, 234, 0.05)', borderRadius: '8px' }}>
                    <p style={{ margin: '0 0 4px 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Address</p>
                    <p style={{ margin: 0, fontSize: '1.05rem', fontWeight: '500' }}>
                      {profile.address}, {profile.city}, {profile.country}
                    </p>
                  </div>
                )}

                <div style={{ padding: '12px', background: 'rgba(102, 126, 234, 0.05)', borderRadius: '8px' }}>
                  <p style={{ margin: '0 0 4px 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Currency & Timezone</p>
                  <p style={{ margin: 0, fontSize: '1.05rem', fontWeight: '500' }}>
                    {profile?.currency} • {profile?.timezone}
                  </p>
                </div>

                <div style={{ padding: '12px', background: 'rgba(102, 126, 234, 0.05)', borderRadius: '8px' }}>
                  <p style={{ margin: '0 0 4px 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Member Since</p>
                  <p style={{ margin: 0, fontSize: '1.05rem', fontWeight: '500' }}>
                    {new Date(profile?.createdAt || '').toLocaleDateString('en-IN')}
                  </p>
                </div>

                <button className="btn btn-primary" onClick={() => setEditing(true)}>
                  ✏️ Edit Profile
                </button>
              </div>
            )}
          </div>
        )}

        {/* SECURITY TAB */}
        {activeTab === 'security' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Change Password */}
            <div className="glass-card" style={{ maxWidth: '600px' }}>
              <h3 style={{ margin: '0 0 20px 0', color: 'var(--text-primary)' }}>🔐 Change Password</h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Current Password</label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="Enter current password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">New Password</label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="Enter new password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Confirm Password</label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="Confirm new password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  />
                </div>

                <button className="btn btn-primary" onClick={handlePasswordChange}>
                  💾 Update Password
                </button>
              </div>
            </div>

            {/* Two-Factor Authentication */}
            <div className="glass-card" style={{ maxWidth: '600px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>🔒 Two-Factor Authentication</h3>
                <button
                  className={`btn ${profile?.twoFactorEnabled ? 'btn-danger' : 'btn-primary'}`}
                  onClick={handleTwoFactorToggle}
                >
                  {profile?.twoFactorEnabled ? '🚫 Disable' : '✅ Enable'}
                </button>
              </div>

              <p style={{ color: 'var(--text-secondary)', marginBottom: '12px' }}>
                Status: <strong style={{ color: profile?.twoFactorEnabled ? '#10b981' : '#f59e0b' }}>
                  {profile?.twoFactorEnabled ? '✅ Enabled' : '⚠️ Disabled'}
                </strong>
              </p>

              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
                Two-factor authentication adds an extra layer of security to your account. When enabled, you'll need to verify your identity using an authenticator app or phone number.
              </p>
            </div>

            {/* Active Sessions */}
            <div className="glass-card" style={{ maxWidth: '600px' }}>
              <h3 style={{ margin: '0 0 20px 0', color: 'var(--text-primary)' }}>📱 Active Sessions</h3>
              <div style={{ padding: '12px', background: 'rgba(102, 126, 234, 0.05)', borderRadius: '8px', marginBottom: '16px' }}>
                <p style={{ margin: '0 0 8px 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  🖥️ Current Browser
                </p>
                <p style={{ margin: '0 0 4px 0', fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                  {navigator.userAgent.split(' ').slice(-2).join(' ')}
                </p>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>
                  Active now
                </p>
              </div>
              <button className="btn btn-danger" style={{ width: '100%' }}>
                🚪 Logout All Other Sessions
              </button>
            </div>
          </div>
        )}

        {/* PREFERENCES TAB */}
        {activeTab === 'preferences' && (
          <div className="glass-card" style={{ maxWidth: '600px' }}>
            <h3 style={{ margin: '0 0 20px 0', color: 'var(--text-primary)' }}>⚙️ Preferences</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{
                padding: '16px',
                background: 'rgba(102, 126, 234, 0.05)',
                borderRadius: '10px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <p style={{ margin: 0, fontWeight: '600', marginBottom: '4px' }}>🌙 Dark Theme</p>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Always enabled for premium UX</p>
                </div>
                <div style={{ fontSize: '1.5rem' }}>✅</div>
              </div>

              <div style={{
                padding: '16px',
                background: 'rgba(102, 126, 234, 0.05)',
                borderRadius: '10px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <p style={{ margin: 0, fontWeight: '600', marginBottom: '4px' }}>🔔 Email Notifications</p>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Receive expense updates via email</p>
                </div>
                <input
                  type="checkbox"
                  defaultChecked={profile?.preferences?.notifications ?? true}
                  style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">📧 Email Digest Frequency</label>
                <select className="form-input" defaultValue={profile?.preferences?.emailDigest || 'weekly'}>
                  <option value="never">Never</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">🌐 Language</label>
                <select className="form-input" defaultValue={profile?.preferences?.language || 'en'}>
                  <option value="en">English</option>
                  <option value="hi">Hindi (हिंदी)</option>
                  <option value="es">Spanish</option>
                </select>
              </div>

              <button className="btn btn-primary" style={{ width: '100%' }}>
                💾 Save Preferences
              </button>
            </div>
          </div>
        )}
      </div>
    </AdvancedLayout>
  );
}
