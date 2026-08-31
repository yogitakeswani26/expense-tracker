import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import '../styles/global-advanced.css';

interface AdvancedLayoutProps {
  children: React.ReactNode;
}

export const AdvancedLayout: React.FC<AdvancedLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();

  const menuItems = [
    { path: '/dashboard', icon: '💼', label: 'Dashboard', color: '#667eea' },
    { path: '/expenses', icon: '💳', label: 'Expenses', color: '#06b6d4' },
    { path: '/family', icon: '👨‍👩‍👧‍👦', label: 'Family', color: '#8b5cf6' },
    { path: '/analytics', icon: '📊', label: 'Analytics', color: '#f59e0b' },
    { path: '/export', icon: '📥', label: 'Export', color: '#10b981' },
    { path: '/settings', icon: '⚙️', label: 'Settings', color: '#06b6d4' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="app-container">
      {/* SIDEBAR */}
      <aside className="sidebar">
        {/* Logo */}
        <div className="logo-section" onClick={() => navigate('/dashboard')}>
          <div className="logo-icon">💰</div>
          <div className="logo-text">
            <h2>ExpenseTracker</h2>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="nav-menu">
          {menuItems.map((item) => (
            <a
              key={item.path}
              href={item.path}
              className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
              onClick={(e) => {
                e.preventDefault();
                navigate(item.path);
              }}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </a>
          ))}
        </nav>

        {/* User Section */}
        <div className="user-section">
          <div className="user-info">
            <div className="user-avatar">{user?.name?.charAt(0) || 'U'}</div>
            <div className="user-name">{user?.name || 'User'}</div>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            🚪 Logout
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="main-content">
        {/* Animated Background */}
        <div className="background-animation">
          <div className="floating-gradient gradient-1"></div>
          <div className="floating-gradient gradient-2"></div>
        </div>

        {/* Page Content */}
        <div className="page-content">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AdvancedLayout;
