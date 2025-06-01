
import React, { createContext, useContext } from 'react';
import type { AuthContextType } from './auth/types';
import { useAuthState } from './auth/useAuthState';
import { loginUser, registerUser, logoutUser } from './auth/authService';
import { toast } from 'sonner';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, session, loading, setLoading } = useAuthState();

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      await loginUser(email, password);
      toast.success('Login successful! Redirecting...');
      // Note: Redirect will be handled by Index.tsx based on auth state change
    } catch (error: any) {
      console.error('Login failed:', error);
      setLoading(false);
      toast.error(error.message || 'Login failed');
      throw new Error(error.message || 'Login failed');
    }
  };

  const register = async (userData: Omit<import('./auth/types').User, 'id'> & { password: string }) => {
    setLoading(true);
    
    try {
      await registerUser(userData);
      toast.success('Registration successful! Please check your email for confirmation.');
      // Note: Redirect will be handled by Index.tsx based on auth state change
    } catch (error: any) {
      console.error('Registration failed:', error);
      setLoading(false);
      
      // Show user-friendly error messages
      if (error.message.includes('email')) {
        toast.error('Please check your email and click the confirmation link to complete registration');
      } else {
        toast.error(error.message || 'Registration failed');
      }
      throw error;
    }
  };

  const logout = async () => {
    try {
      await logoutUser();
      toast.success('Logged out successfully');
    } catch (error: any) {
      console.error('Logout failed:', error);
      toast.error('Logout failed');
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// Re-export types for backward compatibility
export type { User } from './auth/types';
