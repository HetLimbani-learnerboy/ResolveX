import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Layouts
import DashboardLayout from './layouts/DashboardLayout';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import CustomerDashboard from './pages/dashboards/CustomerDashboard';
import SupportDashboard from './pages/dashboards/SupportDashboard'; // This serves 'executive'
import QADashboard from './pages/dashboards/QADashboard';
import ManagerDashboard from './pages/dashboards/ManagerDashboard';
import AdminDashboard from './pages/dashboards/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';

/**
 * Enhanced ProtectedRoute
 * 1. Checks if user is logged in
 * 2. Checks if user role matches allowed roles
 * 3. Handles the "Loading" state from AuthContext
 */
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <h2>Loading ResolveX...</h2>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  // If specific roles are required and user doesn't have them
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Note: We removed the hardcoded 'admin' bypass here to ensure 
    // explicit permission, but you can add it back if admins should see everything.
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

/**
 * DashboardRouter
 * Directs the user to the correct dashboard component based on 
 * the exact role strings returned by your Python Backend.
 */
const DashboardRouter = () => {
  const { user } = useAuth();
  
  if (!user) return <Navigate to="/login" replace />;

  // These cases MUST match your database/Postman strings exactly
  switch (user.role) {
    case 'admin': 
      return <AdminDashboard />;
    case 'customer': 
      return <CustomerDashboard />;
    case 'executive': // Matches your Postman data
      return <SupportDashboard />;
    case 'qa_team':   // Matches common DB naming
      return <QADashboard />;
    case 'operations_manager': // Matches your login redirect logic
      return <ManagerDashboard />;
    default: 
      return <div className="p-4">Unknown Role: {user.role}</div>;
  }
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          
          {/* Dynamic Dashboard Route */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <DashboardLayout>
                <DashboardRouter />
              </DashboardLayout>
            </ProtectedRoute>
          } />

          {/* Role-Specific Named Routes (Optional) */}
          <Route path="/executive-dashboard" element={
            <ProtectedRoute allowedRoles={['executive', 'admin']}>
              <DashboardLayout>
                <SupportDashboard />
              </DashboardLayout>
            </ProtectedRoute>
          } />

          <Route path="/admin/users" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <DashboardLayout>
                <UserManagement />
              </DashboardLayout>
            </ProtectedRoute>
          } />

          {/* Catch-all Redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;