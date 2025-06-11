
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

interface RoleProtectionProps {
  children: React.ReactNode;
  allowedRoles: string[];
  redirectTo?: string;
}

const RoleProtection = ({ children, allowedRoles, redirectTo }: RoleProtectionProps) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [showAccessDenied, setShowAccessDenied] = useState(false);
  const [timeoutReached, setTimeoutReached] = useState(false);

  useEffect(() => {
    // Set a timeout to handle cases where loading takes too long
    const timeout = setTimeout(() => {
      console.log('🕐 [ROLE_PROTECTION] Timeout reached, checking session status...');
      setTimeoutReached(true);
      
      // If still loading after timeout and no user, something might be wrong
      if (loading && !user) {
        console.warn('⚠️ [ROLE_PROTECTION] Session loading timeout - showing access denied');
        setShowAccessDenied(true);
      }
    }, 5000);

    return () => clearTimeout(timeout);
  }, [loading, user]);

  useEffect(() => {
    if (!loading && user) {
      console.log('✅ [ROLE_PROTECTION] User loaded:', { 
        role: user.role, 
        allowedRoles, 
        hasAccess: allowedRoles.includes(user.role) 
      });

      if (!allowedRoles.includes(user.role)) {
        console.log('🔄 [ROLE_PROTECTION] Redirecting user to correct dashboard...');
        
        // Redirect based on user role
        if (redirectTo) {
          navigate(redirectTo);
        } else {
          switch (user.role) {
            case 'client':
              navigate('/client-dashboard');
              break;
            case 'tasker':
              if (user.approved) {
                navigate('/tasker-dashboard');
              } else {
                navigate('/tasker-pending');
              }
              break;
            case 'admin':
              navigate('/admin-dashboard');
              break;
            default:
              console.warn('⚠️ [ROLE_PROTECTION] Unknown role, redirecting to home');
              navigate('/');
          }
        }
      }
    } else if (!loading && !user && timeoutReached) {
      console.log('❌ [ROLE_PROTECTION] No user found after timeout');
      setShowAccessDenied(true);
    }
  }, [user, loading, allowedRoles, navigate, redirectTo, timeoutReached]);

  // Show loading while auth is initializing (and timeout hasn't been reached)
  if (loading && !timeoutReached) {
    console.log('⏳ [ROLE_PROTECTION] Waiting for auth to load...');
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Show access denied only after we're sure there's no valid session
  if (!user && (showAccessDenied || timeoutReached)) {
    console.log('🚫 [ROLE_PROTECTION] Showing access denied - no valid session');
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center px-4">
        <Card className="w-full max-w-md shadow-xl border-0">
          <CardHeader className="text-center">
            <AlertTriangle className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <CardTitle className="text-red-900">Access Denied</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 mb-4">You need to be logged in to access this page.</p>
            <button 
              onClick={() => navigate('/')}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
            >
              Go to Login
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show role-based access denied only if user exists but doesn't have the right role
  if (user && !allowedRoles.includes(user.role)) {
    console.log('🚫 [ROLE_PROTECTION] User has wrong role:', { userRole: user.role, allowedRoles });
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center px-4">
        <Card className="w-full max-w-md shadow-xl border-0">
          <CardHeader className="text-center">
            <AlertTriangle className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <CardTitle className="text-red-900">Access Denied</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600">
              You don't have permission to access this page. 
              Your role is: <span className="font-semibold">{user.role}</span>
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If we get here, user has the right role - show the protected content
  console.log('✅ [ROLE_PROTECTION] Access granted');
  return <>{children}</>;
};

export default RoleProtection;
