import React from 'react';
import { Navigate, useLocation } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import type { RoleType } from '../../types/nexus';
import { toast } from 'sonner';

interface ProtectedRouteProps {
  requiredRole: RoleType;
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ requiredRole, children }) => {
  const { currentUser, isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated || !currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If logged in as another role, redirect to their respective dashboard
  if (currentUser.role !== requiredRole) {
    toast.error(`Bạn không có quyền truy cập trang này. Đang chuyển hướng về trang của bạn.`);
    const roleRoutes: Record<RoleType, string> = {
      admin: '/admin',
      retail: '/retail',
      technical: '/technical',
      accounts: '/accounts',
      user: '/user',
    };
    return <Navigate to={roleRoutes[currentUser.role]} replace />;
  }

  return <>{children}</>;
};

