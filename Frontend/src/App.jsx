import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate
} from 'react-router-dom';

import {
  AuthProvider,
  useAuth
} from './context/AuthContext';

/* Layout */
import DashboardLayout from './layouts/DashboardLayout';

/* Public Pages */
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';

/* Dashboards */
import CustomerDashboard from './pages/dashboards/CustomerDashboard';
import SupportDashboard from './pages/dashboards/SupportDashboard';
import QADashboard from './pages/dashboards/QADashboard';
import ManagerDashboard from './pages/dashboards/ManagerDashboard';
import AdminDashboard from './pages/dashboards/AdminDashboard';

/* Admin */
import UserManagement from './pages/admin/UserManagement';

/* QA Pages */
import AuditComplaints from './pages/qa-dashboard/AuditComplaints';
import Misclassifications from './pages/qa-dashboard/Misclassifications';
import RecurringIssues from './pages/qa-dashboard/RecurringIssues';
import ResolutionReview from './pages/qa-dashboard/ResolutionReview';
import Feedback from './pages/qa-dashboard/Feedback';


/* ==========================================
   Protected Route
========================================== */
const ProtectedRoute = ({
  children,
  allowedRoles
}) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div
        style={{
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        Verifying Session...
      </div>
    );
  }

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  if (
    allowedRoles &&
    !allowedRoles.includes(user.role)
  ) {
    return (
      <Navigate
        to="/dashboard"
        replace
      />
    );
  }

  return children;
};


/* ==========================================
   Dynamic Dashboard Router
========================================== */
const DashboardRouter = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  switch (user.role) {
    case 'admin':
      return <AdminDashboard />;

    case 'customer':
      return <CustomerDashboard />;

    case 'executive':
      return <SupportDashboard />;

    case 'qa_team':
      return <QADashboard />;

    case 'operations_manager':
      return <ManagerDashboard />;

    default:
      return (
        <Navigate
          to="/login"
          replace
        />
      );
  }
};


/* ==========================================
   App
========================================== */
function App() {
  return (
    <AuthProvider>
      <Router>

        <Routes>

          {/* Public */}
          <Route
            path="/"
            element={<LandingPage />}
          />

          <Route
            path="/login"
            element={<LoginPage />}
          />

          {/* Main Dashboard */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <DashboardRouter />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* ======================================
             ADMIN
          ====================================== */}
          <Route
            path="/admin-dashboard"
            element={
              <ProtectedRoute
                allowedRoles={['admin']}
              >
                <DashboardLayout>
                  <AdminDashboard />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/users"
            element={
              <ProtectedRoute
                allowedRoles={['admin']}
              >
                <DashboardLayout>
                  <UserManagement />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* ======================================
             CUSTOMER
          ====================================== */}
          <Route
            path="/customer-dashboard"
            element={
              <ProtectedRoute
                allowedRoles={[
                  'customer',
                  'admin'
                ]}
              >
                <DashboardLayout>
                  <CustomerDashboard />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* ======================================
             EXECUTIVE
          ====================================== */}
          <Route
            path="/executive-dashboard"
            element={
              <ProtectedRoute
                allowedRoles={[
                  'executive',
                  'admin'
                ]}
              >
                <DashboardLayout>
                  <SupportDashboard />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* ======================================
             QA TEAM
          ====================================== */}
          <Route
            path="/qa-dashboard"
            element={
              <ProtectedRoute
                allowedRoles={[
                  'qa_team',
                  'admin',
                  'operations_manager'
                ]}
              >
                <DashboardLayout>
                  <QADashboard />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/audit-complaints"
            element={
              <ProtectedRoute
                allowedRoles={[
                  'qa_team',
                  'admin',
                  'operations_manager'
                ]}
              >
                <DashboardLayout>
                  <AuditComplaints />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/misclassifications"
            element={
              <ProtectedRoute
                allowedRoles={[
                  'qa_team',
                  'admin',
                  'operations_manager'
                ]}
              >
                <DashboardLayout>
                  <Misclassifications />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/recurring-issues"
            element={
              <ProtectedRoute
                allowedRoles={[
                  'qa_team',
                  'admin',
                  'operations_manager'
                ]}
              >
                <DashboardLayout>
                  <RecurringIssues />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/resolution-review"
            element={
              <ProtectedRoute
                allowedRoles={[
                  'qa_team',
                  'admin',
                  'operations_manager'
                ]}
              >
                <DashboardLayout>
                  <ResolutionReview />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />



          <Route
            path="/feedback"
            element={
              <ProtectedRoute
                allowedRoles={[
                  'qa_team',
                  'admin',
                  'operations_manager'
                ]}
              >
                <DashboardLayout>
                  <Feedback />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* ======================================
             OPERATIONS MANAGER
          ====================================== */}
          <Route
            path="/manager-dashboard"
            element={
              <ProtectedRoute
                allowedRoles={[
                  'operations_manager',
                  'admin'
                ]}
              >
                <DashboardLayout>
                  <ManagerDashboard />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route
            path="*"
            element={
              <Navigate
                to="/"
                replace
              />
            }
          />

        </Routes>

      </Router>
    </AuthProvider>
  );
}

export default App;