import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const isActiveRoute = (route: string) => location.pathname === route;

  const handleLogout = () => {
    logout();
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    navigate('/login');
  };

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/expenses', label: 'Expenses', icon: '💸' },
    { path: '/family', label: 'Family', icon: '👥' },
    { path: '/analytics', label: 'Analytics', icon: '📈' },
    { path: '/export', label: 'Export', icon: '📥' },
    { path: '/settings', label: 'Settings', icon: '⚙️' },
  ];

  return (
    <div className="min-h-screen flex">
      {/* Sidebar Navigation */}
      <div className="hidden md:flex md:w-64 bg-blue-900 text-white flex-col">
        <div className="p-6">
          <div className="text-3xl mb-2">💰</div>
          <h1 className="text-xl font-bold">Expense Tracker</h1>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full text-left px-4 py-3 rounded-lg transition ${
                isActiveRoute(item.path)
                  ? 'bg-blue-700 text-white'
                  : 'text-blue-100 hover:bg-blue-800'
              }`}
            >
              <span className="mr-2">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="border-t border-blue-800 p-4">
          <div className="text-sm text-blue-100">{user?.name}</div>
          <button
            onClick={handleLogout}
            className="w-full mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
        <div className="flex justify-around">
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex-1 py-3 text-center text-xs transition ${
                isActiveRoute(item.path)
                  ? 'text-blue-600 border-t-2 border-blue-600'
                  : 'text-gray-600'
              }`}
            >
              <div className="text-xl">{item.icon}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col md:pb-0 pb-20">
        {/* Top Bar - Mobile */}
        <div className="md:hidden bg-blue-600 text-white p-4 flex justify-between items-center">
          <h1 className="font-bold">💰 Expense Tracker</h1>
          <button
            onClick={handleLogout}
            className="text-xs bg-red-600 px-3 py-1 rounded hover:bg-red-700"
          >
            Logout
          </button>
        </div>

        {/* Page Content */}
        <div className="flex-1 overflow-auto">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
