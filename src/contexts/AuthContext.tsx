
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
        console.log('Auth state change:', event, session?.user?.id);
        setSession(session);
        
        if (session?.user) {
          // Fetch user profile from users table
          const { data: userProfile, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle(); // Use maybeSingle to avoid errors when no profile exists yet
          
          console.log('Fetched user profile:', userProfile, error);
          
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
      
      if (error) {
        console.error('Login error:', error);
        throw error;
      }
    } catch (error: any) {
      setLoading(false);
      throw new Error(error.message || 'Login failed');
    }
  };

  const register = async (userData: Omit<User, 'id'> & { password: string }) => {
    setLoading(true);
    let authUser = null;
    
    try {
      console.log('Starting registration process...');
      
      // First, create the auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`
        }
      });
      
      if (authError) {
        console.error('Auth registration error:', authError);
        throw new Error(`Authentication failed: ${authError.message}`);
      }

      if (!authData.user) {
        throw new Error('Failed to create user account');
      }

      console.log('Auth user created with ID:', authData.user.id);
      authUser = authData.user;
      
      // Insert user profile into users table with the exact same ID
      const userRecord = {
        id: authData.user.id, // This must match auth.uid()
        name: userData.name,
        email: userData.email,
        phone: userData.phone || null,
        location: userData.location || '',
        role: userData.role,
        approved: userData.role === 'client' ? 'true' : 'false',
        created_at: new Date().toISOString()
      };
      
      console.log('Inserting user record with ID:', userRecord.id);
      
      const { data: insertedUser, error: profileError } = await supabase
        .from('users')
        .insert(userRecord)
        .select()
        .single();
      
      if (profileError) {
        console.error('Profile insertion error:', profileError);
        console.error('Full error details:', {
          message: profileError.message,
          details: profileError.details,
          hint: profileError.hint,
          code: profileError.code
        });
        
        // If profile creation fails, we should clean up the auth user
        if (authUser) {
          console.log('Cleaning up auth user due to profile creation failure...');
          await supabase.auth.admin.deleteUser(authUser.id).catch(err => 
            console.error('Failed to cleanup auth user:', err)
          );
        }
        
        throw new Error(`Failed to create user profile: ${profileError.message}${profileError.details ? `. Details: ${profileError.details}` : ''}`);
      }
      
      console.log('User profile created successfully:', insertedUser);
      console.log('Registration completed successfully for user ID:', authData.user.id);
      
    } catch (error: any) {
      console.error('Registration failed:', error);
      setLoading(false);
      throw error; // Re-throw the original error with its message
    }
    // Note: Don't set loading to false here, let the auth state change handle it
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
