// src/components/auth/PermissionGuard.tsx
import React from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { useAuth } from '../../lib/auth-context';
import { hasPermission, getFirstAllowedPage } from '../../lib/permissions';

interface PermissionGuardProps {
  children: React.ReactNode;
  permission: string;
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({ 
  children, 
  permission
}) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { campId } = useParams<{ campId: string }>();

  if (isLoading) {
    return null; // or a loading spinner
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // Check if user has the required permission
  if (!hasPermission(user, permission)) {
    // Redirect to the first allowed page for this user
    if (campId) {
      const firstAllowedPage = getFirstAllowedPage(user, campId);
      return <Navigate to={firstAllowedPage} replace />;
    }
    
    // Fallback redirect
    return <Navigate to="/camps" replace />;
  }

  return <>{children}</>;
};
