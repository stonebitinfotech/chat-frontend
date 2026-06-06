import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { ThemeProvider } from './context/ThemeContext';
import DashboardLayout from './components/layout/DashboardLayout';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import Dashboard from './pages/dashboard/Dashboard';
import LiveChats from './pages/dashboard/LiveChats';
import Tickets from './pages/dashboard/Tickets';
import Visitors from './pages/dashboard/Visitors';
import Agents from './pages/dashboard/Agents';
import Articles from './pages/dashboard/Articles';
import Analytics from './pages/dashboard/Analytics';
import Settings from './pages/dashboard/Settings';
import PortalEntry from './pages/portal/PortalEntry';
import PortalDashboard from './pages/portal/PortalDashboard';
import PortalTicketDetail from './pages/portal/PortalTicketDetail';

const ProtectedRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard/chats" replace />;
  return children;
};

const GuestRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  return !user ? children : <Navigate to="/dashboard" replace />;
};

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<Navigate to="/dashboard" replace />} />
    <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
    <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />
    <Route path="/forgot-password" element={<GuestRoute><ForgotPassword /></GuestRoute>} />
    <Route path="/reset-password/:token" element={<GuestRoute><ResetPassword /></GuestRoute>} />
    <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
      <Route index element={<ProtectedRoute roles={['admin','manager']}><Dashboard /></ProtectedRoute>} />
      <Route path="chats" element={<LiveChats />} />
      <Route path="chats/:id" element={<LiveChats />} />
      <Route path="tickets" element={<Tickets />} />
      <Route path="tickets/:id" element={<Tickets />} />
      <Route path="visitors" element={<ProtectedRoute roles={['admin','manager']}><Visitors /></ProtectedRoute>} />
      <Route path="agents" element={<ProtectedRoute roles={['admin','manager']}><Agents /></ProtectedRoute>} />
      <Route path="articles" element={<ProtectedRoute roles={['admin','manager']}><Articles /></ProtectedRoute>} />
      <Route path="analytics" element={<ProtectedRoute roles={['admin','manager']}><Analytics /></ProtectedRoute>} />
      <Route path="settings" element={<ProtectedRoute roles={['admin','manager']}><Settings /></ProtectedRoute>} />
    </Route>
    {/* Customer Support Portal — public, no admin auth needed */}
    <Route path="/portal/:companyId" element={<PortalEntry />} />
    <Route path="/portal/:companyId/dashboard" element={<PortalDashboard />} />
    <Route path="/portal/:companyId/tickets/:ticketId" element={<PortalTicketDetail />} />
    <Route path="*" element={<Navigate to="/dashboard" replace />} />
  </Routes>
);

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SocketProvider>
          <AppRoutes />
        </SocketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
