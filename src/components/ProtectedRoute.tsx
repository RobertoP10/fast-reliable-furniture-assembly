
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Wrench } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('client' | 'tasker' | 'admin')[];
  requireApproval?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  allowedRoles,
  requireApproval = false 
}) => {
  const { user, session, loading } = useAuth();
  const location = useLocation();

  console.log('ProtectedRoute check:', { 
    loading, 
    session: !!session, 
    user: user?.role, 
    approved: user?.approved, 
    allowedRoles, 
    requireApproval,
    path: location.pathname 
  });

  // Show loading spinner while auth is loading
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <Wrench className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If no session, redirect to home
  if (!session || !user) {
    console.log('No session or user found, redirecting to home');
    return <Navigate to="/" replace />;
  }

  // Check role permissions
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    console.log('User role not allowed:', user.role, 'allowed:', allowedRoles);
    
    // Redirect based on user's actual role
    if (user.role === 'admin') {
      return <Navigate to="/admin-dashboard" replace />;
    } else if (user.role === 'tasker') {
      if (user.approved === true) {
        return <Navigate to="/tasker-dashboard" replace />;
      } else {
        return <Navigate to="/tasker-pending" replace />;
      }
    } else if (user.role === 'client') {
      return <Navigate to="/client-dashboard" replace />;
    }
    
    return <Navigate to="/" replace />;
  }

  // Check if tasker needs approval and redirect to pending page
  if (user.role === 'tasker' && requireApproval && user.approved !== true) {
    console.log('Tasker not approved, redirecting to pending');
    return <Navigate to="/tasker-pending" replace />;
  }

  console.log('Access granted to protected route');
  return <>{children}</>;
};

export default ProtectedRoute;
