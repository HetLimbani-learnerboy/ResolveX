import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Layouts
import DashboardLayout from './layouts/DashboardLayout';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import CustomerDashboard from './pages/dashboards/CustomerDashboard';
import SupportDashboard from './pages/dashboards/SupportDashboard';
import QADashboard from './pages/dashboards/QADashboard';
import ManagerDashboard from './pages/dashboards/ManagerDashboard';
import AdminDashboard from './pages/dashboards/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';

/**
 * ProtectedRoute Component
 * Restricts access based on authentication and role permissions.
 */
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="animate-pulse text-xl font-bold">Verifying Session...</div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // If user is logged in but doesn't have the role for this specific URL,
    // send them back to their own default dashboard.
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

/**
 * DashboardRouter
 * The "Switchboard": Determines which specific component to show 
 * when the user hits the generic /dashboard route.
 */
const DashboardRouter = () => {
  const { user } = useAuth();
  
  if (!user) return <Navigate to="/login" replace />;

  switch (user.role) {
    case 'admin':              return <AdminDashboard />;
    case 'customer':           return <CustomerDashboard />;
    case 'executive':          return <SupportDashboard />;
    case 'qa_team':            return <QADashboard />;
    case 'operations_manager': return <ManagerDashboard />;
    default:                   return <Navigate to="/login" replace />;
  }
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Access */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          
          {/* 1. The Primary Dynamic Route */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <DashboardLayout>
                <DashboardRouter />
              </DashboardLayout>
            </ProtectedRoute>
          } />

          {/* 2. Explicit Role-Based Routes (Supports all roles) */}
          
          {/* Admin & Management */}
          <Route path="/admin-dashboard" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <DashboardLayout><AdminDashboard /></DashboardLayout>
            </ProtectedRoute>
          } />

          <Route path="/admin/users" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <DashboardLayout><UserManagement /></DashboardLayout>
            </ProtectedRoute>
          } />

          <Route path="/manager-dashboard" element={
            <ProtectedRoute allowedRoles={['operations_manager', 'admin']}>
              <DashboardLayout><ManagerDashboard /></DashboardLayout>
            </ProtectedRoute>
          } />

          {/* Support & QA */}
          <Route path="/executive-dashboard" element={
            <ProtectedRoute allowedRoles={['executive', 'admin']}>
              <DashboardLayout><SupportDashboard /></DashboardLayout>
            </ProtectedRoute>
          } />

          <Route path="/qa-dashboard" element={
            <ProtectedRoute allowedRoles={['qa_team', 'admin']}>
              <DashboardLayout><QADashboard /></DashboardLayout>
            </ProtectedRoute>
          } />

          {/* Customer */}
          <Route path="/customer-dashboard" element={
            <ProtectedRoute allowedRoles={['customer', 'admin']}>
              <DashboardLayout><CustomerDashboard /></DashboardLayout>
            </ProtectedRoute>
          } />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;