import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import Login from './pages/Login';
import Signup from './pages/Signup';
import DashboardPro from './pages/DashboardPro';
import ExpensesAdvanced from './pages/ExpensesAdvanced';
import Family from './pages/Family';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import Export from './pages/Export';
import ProfilePage from './pages/ProfilePage';
import FamilyManagement from './pages/FamilyManagement';
import BillSplitting from './pages/BillSplitting';
import AdvancedLayout from './components/AdvancedLayout';
import PrivateRoute from './components/PrivateRoute';
import './styles/global-advanced.css';

function App() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return (
    <Router>
      <Routes>
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/dashboard" /> : <Login />}
        />
        <Route
          path="/signup"
          element={isAuthenticated ? <Navigate to="/dashboard" /> : <Signup />}
        />

        {/* Protected Routes with Advanced Layout */}
        <Route element={<PrivateRoute />}>
          <Route element={<AdvancedLayout />}>
            <Route path="/dashboard" element={<DashboardPro />} />
            <Route path="/expenses" element={<ExpensesAdvanced />} />
            <Route path="/family" element={<FamilyManagement />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/bill-split" element={<BillSplitting />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/export" element={<Export />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Route>

        <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;
