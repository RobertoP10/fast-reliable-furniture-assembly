
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
  requireApproval?: boolean;
}

const ProtectedRoute = ({ children, requiredRole, requireApproval = false }: ProtectedRouteProps) => {
  const { user, loading, getDashboardRoute } = useAuthContext();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      console.log('ProtectedRoute check:', { user, requiredRole, requireApproval });
      
      if (!user) {
        console.log('No user, redirecting to home');
        navigate('/');
        return;
      }

      if (requiredRole && user.role !== requiredRole) {
        console.log('Wrong role, redirecting to appropriate dashboard');
        // Redirect to appropriate dashboard
        const dashboardRoute = getDashboardRoute(user.role, user.approved);
        navigate(dashboardRoute);
        return;
      }

      if (requireApproval && user.role === 'tasker' && !user.approved) {
        console.log('Tasker not approved, redirecting to pending page');
        navigate('/tasker-pending');
        return;
      }
    }
  }, [user, loading, navigate, requiredRole, requireApproval, getDashboardRoute]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (requiredRole && user.role !== requiredRole) {
    return null;
  }

  if (requireApproval && user.role === 'tasker' && !user.approved) {
    return null;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
