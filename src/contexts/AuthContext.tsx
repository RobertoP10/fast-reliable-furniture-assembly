
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { useToast } from '@/hooks/use-toast';
import type { UserData, AuthContextType } from './auth/types';
import { createAuthOperations } from './auth/authOperations';
import { createAuthStateManager } from './auth/authStateManager';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [waitingForProfile, setWaitingForProfile] = useState(false);
  const { toast } = useToast();

  const { setupAuthListener, initializeAuth } = createAuthStateManager(
    setUser,
    setUserData,
    setLoading
  );

  const { login, register, logout } = createAuthOperations(
    setWaitingForProfile,
    toast
  );

  useEffect(() => {
    const subscription = setupAuthListener();
    initializeAuth();

    return () => {
      console.log('🧹 [AUTH_CONTEXT] Cleaning up auth listener');
      subscription.unsubscribe();
    };
  }, []);

  const value: AuthContextType = {
    user,
    userData,
    loading,
    waitingForProfile,
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
