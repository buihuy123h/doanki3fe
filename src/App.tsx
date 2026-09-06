import { Routes, Route, Navigate } from 'react-router';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NexusProvider } from './context/NexusContext';
import { ThemeProvider } from './context/ThemeContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { RetailDashboard } from './pages/RetailDashboard';
import { TechnicalDashboard } from './pages/TechnicalDashboard';
import { AccountsDashboard } from './pages/AccountsDashboard';
import { Toaster } from './components/ui/sonner';
import type { RoleType } from './types/nexus';

// Root index redirector based on authentication and role
function RootIndexRedirect() {
  const { currentUser, isAuthenticated } = useAuth();

  if (!isAuthenticated || !currentUser) {
    return <Navigate to="/login" replace />;
  }

  const roleRoutes: Record<RoleType, string> = {
    admin: '/admin',
    retail: '/retail',
    technical: '/technical',
    accounts: '/accounts',
  };

  return <Navigate to={roleRoutes[currentUser.role]} replace />;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NexusProvider>
          <div className="h-screen w-screen overflow-hidden flex flex-col bg-[#E0F1FF] dark:bg-[#1B2D40] text-[#1B2D40] dark:text-[#E0F1FF] antialiased selection:bg-sky-500 selection:text-white transition-colors duration-300">
          {/* Role-isolated Routes */}
          <div className="flex-1 h-full overflow-hidden">
            <Routes>
              {/* Public Authentication Page (No Registration) */}
              <Route path="/login" element={<LoginPage />} />

              {/* Root index redirects to login or active role dashboard */}
              <Route path="/" element={<RootIndexRedirect />} />

              {/* 1. Admin (Manager) Dashboard - Isolated & Protected */}
              <Route
                path="/admin/*"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />

              {/* 2. Retail Outlet Employee Dashboard - Isolated & Protected */}
              <Route
                path="/retail/*"
                element={
                  <ProtectedRoute requiredRole="retail">
                    <RetailDashboard />
                  </ProtectedRoute>
                }
              />

              {/* 3. Technical Staff Dashboard - Isolated & Protected */}
              <Route
                path="/technical/*"
                element={
                  <ProtectedRoute requiredRole="technical">
                    <TechnicalDashboard />
                  </ProtectedRoute>
                }
              />

              {/* 4. Accounts Department Dashboard - Isolated & Protected */}
              <Route
                path="/accounts/*"
                element={
                  <ProtectedRoute requiredRole="accounts">
                    <AccountsDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Fallback to Root */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>

          {/* Global Toast Notifications */}
          <Toaster
            position="top-right"
            offset="76px"
            richColors
          />
        </div>
      </NexusProvider>
    </AuthProvider>
  </ThemeProvider>
  );
};
