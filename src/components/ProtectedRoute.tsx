
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
  requireApproval?: boolean;
}

const ProtectedRoute = ({ children, requiredRole, requireApproval = false }: ProtectedRouteProps) => {
  const { user, loading } = useAuthContext();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate('/');
        return;
      }

      if (requiredRole && user.role !== requiredRole) {
        // Redirect to appropriate dashboard
        if (user.role === 'admin') {
          navigate('/admin-dashboard');
        } else if (user.role === 'tasker') {
          navigate(user.approved ? '/tasker-dashboard' : '/tasker-pending');
        } else {
          navigate('/client-dashboard');
        }
        return;
      }

      if (requireApproval && user.role === 'tasker' && !user.approved) {
        navigate('/tasker-pending');
        return;
      }
    }
  }, [user, loading, navigate, requiredRole, requireApproval]);

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
