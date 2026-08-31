import { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuthStore } from '../stores/authStore';
import AdvancedLayout from '../components/AdvancedLayout';
import { useTheme, type Theme } from '../contexts/ThemeContext';
import {
  usePreferencesStore,
  requestBrowserNotificationPermission,
  type NotificationPreferences,
} from '../stores/preferencesStore';
import { useToast } from '../contexts/ToastContext';
import { getErrorMessage } from '../utils/helpers';

/**
 * Settings page
 * ----------------------------------------------------------------------------
 * 1. Profile preferences (name/currency/language/timezone) — persisted to the
 *    backend via PUT /auth/profile (unchanged, pre-existing behaviour).
 * 2. Appearance (theme) — persisted client-side via <ThemeProvider> / localStorage.
 * 3. Notifications — persisted client-side via `usePreferencesStore`
 *    (localStorage). See stores/preferencesStore.ts for why this is
 *    device-scoped rather than synced through the backend.
 */

const THEME_OPTIONS: Array<{ value: Theme; label: string; icon: string }> = [
  { value: 'light', label: 'Light', icon: '☀️' },
  { value: 'dark', label: 'Dark', icon: '🌙' },
  { value: 'system', label: 'System', icon: '💻' },
];

const NOTIFICATION_ROWS: Array<{
  key: keyof NotificationPreferences;
  label: string;
  description: string;
}> = [
  {
    key: 'budgetAlerts',
    label: 'Budget alerts',
    description: 'Get an in-app toast when a budget nears or exceeds its limit',
  },
  {
    key: 'expenseActivity',
    label: 'Expense activity',
    description: 'Confirmation toasts when an expense is added, edited or deleted',
  },
  {
    key: 'weeklyDigest',
    label: 'Weekly digest reminder',
    description: 'A gentle nudge to review last week’s spending',
  },
  {
    key: 'soundEnabled',
    label: 'Notification sound',
    description: 'Play a short sound alongside in-app notifications',
  },
  {
    key: 'browserPush',
    label: 'Browser push notifications',
    description: 'Show desktop notifications even when this tab isn’t focused',
  },
];

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
  const toast = useToast();

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
      toast.success('Profile settings saved');
    } catch (err: any) {
      const message = err.response?.data?.error?.message || getErrorMessage(err);
      setError(message);
      toast.error(message, { title: 'Failed to save settings' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdvancedLayout>
      <div className="page-header">
        <h1>⚙️ Settings</h1>
        <p>Manage your profile, appearance and notification preferences</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '720px' }}>
        {/* ---------- Profile ---------- */}
        <div className="glass-card" style={{ padding: '28px' }}>
          <h3 className="settings-section-title">👤 Profile</h3>
          <p className="settings-section-desc">Basic account details and regional preferences</p>

          {error && <div className="modal-error-banner" style={{ marginBottom: '16px' }}>⚠️ {error}</div>}
          {success && (
            <div
              style={{
                marginBottom: '16px',
                padding: '12px 16px',
                borderRadius: '10px',
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                color: '#10b981',
                fontSize: '0.88rem',
              }}
            >
              ✅ {success}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="settings-name">Full Name</label>
              <input
                id="settings-name"
                className="form-input"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                disabled={loading}
              />
            </div>

            <div className="form-row-2">
              <div className="form-group">
                <label className="form-label" htmlFor="settings-currency">Currency</label>
                <select
                  id="settings-currency"
                  className="form-select"
                  name="currency"
                  value={formData.currency}
                  onChange={handleChange}
                  disabled={loading}
                >
                  <option value="INR">₹ Indian Rupee (INR)</option>
                  <option value="USD">$ US Dollar (USD)</option>
                  <option value="EUR">€ Euro (EUR)</option>
                  <option value="GBP">£ British Pound (GBP)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="settings-language">Language</label>
                <select
                  id="settings-language"
                  className="form-select"
                  name="language"
                  value={formData.language}
                  onChange={handleChange}
                  disabled={loading}
                >
                  <option value="en">English</option>
                  <option value="hi">Hindi</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="settings-timezone">Timezone</label>
              <select
                id="settings-timezone"
                className="form-select"
                name="timezone"
                value={formData.timezone}
                onChange={handleChange}
                disabled={loading}
              >
                <option value="Asia/Kolkata">Asia/Kolkata (India)</option>
                <option value="America/New_York">America/New_York (USA)</option>
                <option value="Europe/London">Europe/London (UK)</option>
                <option value="Asia/Dubai">Asia/Dubai (UAE)</option>
              </select>
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center', marginTop: '8px' }}>
              {loading ? (
                <>
                  <span className="btn-spinner" /> Saving…
                </>
              ) : (
                '💾 Save Profile'
              )}
            </button>
          </form>
        </div>

        {/* ---------- Appearance ---------- */}
        <AppearanceSection />

        {/* ---------- Notifications ---------- */}
        <NotificationsSection />
      </div>
    </AdvancedLayout>
  );
}

function AppearanceSection() {
  const { theme, resolvedTheme, setTheme } = useTheme();

  return (
    <div className="glass-card" style={{ padding: '28px' }}>
      <h3 className="settings-section-title">🎨 Appearance</h3>
      <p className="settings-section-desc">
        Choose how ExpenseTracker looks on this device. Currently: <strong>{resolvedTheme}</strong>
      </p>

      <div style={{ display: 'flex', gap: '12px', marginTop: '12px', flexWrap: 'wrap' }}>
        {THEME_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            className={`theme-option ${theme === opt.value ? 'active' : ''}`}
            onClick={() => setTheme(opt.value)}
            aria-pressed={theme === opt.value}
          >
            <span className="theme-option-icon">{opt.icon}</span>
            <span className="theme-option-label">{opt.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function NotificationsSection() {
  const notifications = usePreferencesStore((s) => s.notifications);
  const setNotificationPreference = usePreferencesStore((s) => s.setNotificationPreference);
  const toast = useToast();
  const [permissionDenied, setPermissionDenied] = useState(false);

  const handleToggle = async (key: keyof NotificationPreferences, next: boolean) => {
    if (key === 'browserPush' && next) {
      const permission = await requestBrowserNotificationPermission();
      if (permission !== 'granted') {
        setPermissionDenied(true);
        toast.warning('Browser notifications are blocked in your browser settings', {
          title: 'Permission denied',
        });
        return;
      }
      setPermissionDenied(false);
    }

    setNotificationPreference(key, next);
    toast.info(next ? `${labelFor(key)} enabled` : `${labelFor(key)} disabled`, { duration: 2500 });
  };

  const labelFor = (key: keyof NotificationPreferences) =>
    NOTIFICATION_ROWS.find((r) => r.key === key)?.label ?? key;

  return (
    <div className="glass-card" style={{ padding: '28px' }}>
      <h3 className="settings-section-title">🔔 Notifications</h3>
      <p className="settings-section-desc">
        Control which alerts you see while using the app on this device
      </p>

      {permissionDenied && (
        <div className="modal-error-banner" style={{ marginBottom: '8px' }}>
          ⚠️ Browser notifications are blocked. Enable them in your browser's site settings, then try again.
        </div>
      )}

      <div>
        {NOTIFICATION_ROWS.map((row) => (
          <div className="settings-row" key={row.key}>
            <div>
              <div className="settings-row-label">{row.label}</div>
              <p className="settings-row-desc">{row.description}</p>
            </div>
            <ToggleSwitch
              checked={notifications[row.key]}
              onChange={(next) => handleToggle(row.key, next)}
              label={row.label}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function ToggleSwitch({
  checked,
  onChange,
  label,
  disabled = false,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      className="toggle-switch"
      onClick={() => onChange(!checked)}
    >
      <span className="toggle-switch-thumb" />
    </button>
  );
}
