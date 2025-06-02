
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { Wrench } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: string[];
  requireApproval?: boolean;
}

const ProtectedRoute = ({ children, allowedRoles, requireApproval = false }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();

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

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    // Redirect to appropriate dashboard based on role
    switch (user.role) {
      case 'admin':
        return <Navigate to="/admin-dashboard" replace />;
      case 'tasker':
        if (user.approved === true) {
          return <Navigate to="/tasker-dashboard" replace />;
        } else {
          return <Navigate to="/tasker-pending" replace />;
        }
      case 'client':
      default:
        return <Navigate to="/client-dashboard" replace />;
    }
  }

  if (requireApproval && user.role === 'tasker' && user.approved !== true) {
    return <Navigate to="/tasker-pending" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
