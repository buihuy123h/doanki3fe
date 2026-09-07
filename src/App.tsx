import { Routes, Route, Navigate } from 'react-router';
import { AuthProvider } from './context/AuthContext';
import { NexusProvider } from './context/NexusContext';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { IndexPage } from './pages/IndexPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { RetailDashboard } from './pages/RetailDashboard';
import { TechnicalDashboard } from './pages/TechnicalDashboard';
import { AccountsDashboard } from './pages/AccountsDashboard';
import { UserDashboard } from './pages/UserDashboard';
import { Toaster } from './components/ui/sonner';

export default function App() {
  return (
    <LanguageProvider>
      <ThemeProvider>
        <AuthProvider>
          <NexusProvider>
          <div className="h-screen w-screen overflow-hidden flex flex-col bg-[#E0F1FF] dark:bg-[#1B2D40] text-[#1B2D40] dark:text-[#E0F1FF] antialiased selection:bg-sky-500 selection:text-white transition-colors duration-300">
          {/* Role-isolated Routes */}
          <div className="flex-1 h-full overflow-hidden">
            <Routes>
              {/* Public Product Introduction & Landing Index Page */}
              <Route path="/" element={<IndexPage />} />
              <Route path="/home" element={<IndexPage />} />

              {/* Public Authentication Page */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

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

              {/* 5. Customer / User Dashboard - Isolated & Protected */}
              <Route
                path="/user/*"
                element={
                  <ProtectedRoute requiredRole="user">
                    <UserDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Fallback to Root */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>

          {/* Global Toast Notifications (1s auto dismiss) */}
          <Toaster
            position="top-right"
            offset="76px"
            richColors
            duration={1000}
          />
        </div>
      </NexusProvider>
    </AuthProvider>
  </ThemeProvider>
</LanguageProvider>
  );
};
