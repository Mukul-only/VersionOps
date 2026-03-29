import React, { useState, useEffect } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { AppRole, getFirstAccessibleRoute, hasPermission, ROUTE_PERMISSIONS } from '@/lib/rbac';
import ForbiddenPopup from "@/components/error-pages/ForbiddenPopup.tsx";

export const RbacRoute: React.FC<{ path: string; children: React.ReactNode }> = ({ path, children }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const role = user?.role as AppRole | undefined;
  const required = ROUTE_PERMISSIONS[path];
  const [isForbiddenOpen, setForbiddenOpen] = useState(false);

  const handleClose = () => {
    setForbiddenOpen(false);
    navigate(getFirstAccessibleRoute(role));
  };

  useEffect(() => {
    if (required && !hasPermission(role, required)) {
      setForbiddenOpen(true);
    }
  }, [required, role, path]);

  return (
    <>
      {isForbiddenOpen && <ForbiddenPopup open={isForbiddenOpen} onClose={handleClose} />}
      {children}
    </>
  );
};

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user.role === "PARTICIPANT" && location.pathname === "/") {
    return <Navigate to="/home" replace />;
  }

  return <>{children}</>;
};

export const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || "/";

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (user) {
    return <Navigate to={from} replace />;
  }

  return <>{children}</>;
};
