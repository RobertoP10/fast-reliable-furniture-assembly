
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
            .maybeSingle();
          
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
    
    try {
      console.log('Starting registration process...');
      
      // Step 1: Create the auth user
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
        throw new Error('Failed to create user account - no user returned');
      }

      console.log('Auth user created successfully with ID:', authData.user.id);
      
      // Step 2: Wait for the session to be established
      console.log('Waiting for session to be established...');
      
      // Poll for session with timeout
      let sessionAttempts = 0;
      const maxAttempts = 10;
      let currentSession = null;
      
      while (sessionAttempts < maxAttempts) {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Session check error:', sessionError);
          throw new Error(`Failed to verify session: ${sessionError.message}`);
        }
        
        if (session?.user?.id) {
          currentSession = session;
          console.log('Session established for user ID:', session.user.id);
          break;
        }
        
        sessionAttempts++;
        console.log(`Session attempt ${sessionAttempts}/${maxAttempts}`);
        
        // Wait 500ms before next attempt
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      if (!currentSession || !currentSession.user) {
        throw new Error('Failed to establish authenticated session. Please try logging in manually.');
      }
      
      // Step 3: Create profile in users table using the authenticated user's ID
      const userProfile = {
        id: currentSession.user.id, // This ensures we use auth.uid() for RLS compliance
        name: userData.name.trim(),
        email: userData.email.trim(),
        phone: userData.phone?.trim() || null,
        location: userData.location?.trim() || '',
        role: userData.role,
        approved: userData.role === 'client' ? 'true' : 'false',
        created_at: new Date().toISOString()
      };
      
      console.log('Inserting user profile with authenticated ID:', userProfile.id);
      
      const { data: insertedProfile, error: profileError } = await supabase
        .from('users')
        .insert(userProfile)
        .select()
        .single();
      
      if (profileError) {
        console.error('Profile creation error:', profileError);
        console.error('Full error details:', {
          message: profileError.message,
          details: profileError.details,
          hint: profileError.hint,
          code: profileError.code
        });
        
        // Clean up auth user if profile creation fails
        try {
          await supabase.auth.signOut();
        } catch (cleanupError) {
          console.error('Failed to cleanup auth user:', cleanupError);
        }
        
        throw new Error(`Failed to create user profile: ${profileError.message}${profileError.details ? `. Details: ${profileError.details}` : ''}${profileError.hint ? `. Hint: ${profileError.hint}` : ''}`);
      }
      
      console.log('User profile created successfully:', insertedProfile);
      console.log('Registration completed successfully for user ID:', currentSession.user.id);
      
    } catch (error: any) {
      console.error('Registration failed:', error);
      setLoading(false);
      throw error;
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
