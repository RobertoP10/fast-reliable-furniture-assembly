
import React, { createContext, useContext } from 'react';
import type { AuthContextType } from './auth/types';
import { useAuthState } from './auth/useAuthState';
import { loginUser, registerUser, logoutUser } from './auth/authService';

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
      // Don't set loading to false here - let the auth state change handle it
    } catch (error: any) {
      console.error('Login failed:', error);
      setLoading(false);
      throw new Error(error.message || 'Login failed');
    }
  };

  const register = async (userData: Omit<import('./auth/types').User, 'id'> & { password: string }) => {
    setLoading(true);
    
    try {
      await registerUser(userData);
      console.log('Registration successful');
      // Don't set loading to false here - let the auth state change handle it
    } catch (error: any) {
      console.error('Registration failed:', error);
      setLoading(false);
      throw error;
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await logoutUser();
    } catch (error: any) {
      console.error('Logout failed:', error);
      setLoading(false);
      throw error;
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
