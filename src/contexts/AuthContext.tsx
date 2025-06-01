
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'client' | 'tasker' | 'admin';
  location?: string;
  phone?: string;
  isApproved?: boolean;
  rating?: number;
  completedTasks?: number;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: Omit<User, 'id'> & { password: string }) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
}

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
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        
        if (session?.user) {
          // Fetch user profile from users table
          const { data: userProfile } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          if (userProfile) {
            setUser({
              id: userProfile.id,
              email: userProfile.email || session.user.email || '',
              name: userProfile.name || '',
              role: userProfile.role as 'client' | 'tasker' | 'admin',
              location: userProfile.location || '',
              phone: userProfile.phone || '',
              isApproved: userProfile.approved === 'true',
              rating: 0,
              completedTasks: 0
            });
          }
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        // The auth state change listener will handle setting the user
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
    } catch (error) {
      setLoading(false);
      throw new Error('Login failed');
    }
  };

  const register = async (userData: Omit<User, 'id'> & { password: string }) => {
    setLoading(true);
    try {
      // First, create the auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`
        }
      });
      
      if (authError) throw authError;
      
      if (authData.user) {
        // Insert user profile into users table
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: authData.user.id,
            name: userData.name,
            email: userData.email,
            phone: userData.phone || null,
            location: userData.location,
            role: userData.role,
            approved: userData.role === 'client' ? 'true' : 'false',
            created_at: new Date().toISOString()
          });
        
        if (profileError) throw profileError;
      }
    } catch (error) {
      setLoading(false);
      throw new Error('Registration failed');
    }
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return (
    <AuthContext.Provider value={{ user, session, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
