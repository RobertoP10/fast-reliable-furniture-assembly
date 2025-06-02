
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import type { User, UserRole } from '@/types/database';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: { 
    email: string; 
    password: string; 
    name: string; 
    role: UserRole; 
    location?: string; 
    phone?: string;
  }) => Promise<{ success: boolean; user?: User }>;
  logout: () => void;
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session:', session);
      if (session?.user) {
        fetchUserProfile(session.user);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session);
      if (session?.user) {
        await fetchUserProfile(session.user);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (authUser: SupabaseUser) => {
    try {
      console.log('Fetching profile for user:', authUser.id);
      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        if (error.code === 'PGRST116') {
          console.log('Profile not found, retrying in 2 seconds...');
          setTimeout(() => fetchUserProfile(authUser), 2000);
          return;
        }
        setUser(null);
      } else if (profile) {
        console.log('User profile fetched:', profile);
        setUser(profile as User);
      }
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      console.log('Attempting login for:', email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Login error:', error);
        throw error;
      }

      console.log('Login successful:', data);
      if (data.user) {
        await fetchUserProfile(data.user);
      }
    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error(error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: { 
    email: string; 
    password: string; 
    name: string; 
    role: UserRole; 
    location?: string; 
    phone?: string;
  }) => {
    setLoading(true);
    try {
      console.log('Attempting registration for:', userData.email, 'with role:', userData.role);
      
      // First create the auth user without email confirmation
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          emailRedirectTo: undefined, // Skip email verification
          data: {
            name: userData.name,
            role: userData.role,
            location: userData.location,
            phone: userData.phone,
          }
        }
      });

      if (authError) {
        console.error('Registration auth error:', authError);
        throw authError;
      }

      console.log('Auth registration successful:', authData);

      if (authData.user) {
        console.log('User created with ID:', authData.user.id);
        
        // Manually create the user profile since we're bypassing email verification
        const { data: profileData, error: profileError } = await supabase
          .from('users')
          .insert({
            id: authData.user.id,
            email: userData.email,
            name: userData.name,
            role: userData.role,
            location: userData.location,
            phone: userData.phone,
            approved: userData.role === 'client' ? true : false // Auto-approve clients, taskers need approval
          })
          .select()
          .single();

        if (profileError) {
          console.error('Profile creation error:', profileError);
          // If profile creation fails, still continue as the trigger might have created it
        }

        // Now sign in the user immediately
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: userData.email,
          password: userData.password,
        });

        if (signInError) {
          console.error('Auto sign-in error:', signInError);
          throw signInError;
        }

        console.log('Auto sign-in successful:', signInData);
        
        // Fetch the user profile
        const finalProfile = profileData || await supabase
          .from('users')
          .select('*')
          .eq('id', authData.user.id)
          .single()
          .then(({ data }) => data);

        if (finalProfile) {
          setUser(finalProfile as User);
          return { success: true, user: finalProfile as User };
        }
      }

      return { success: true };
    } catch (error: any) {
      console.error('Registration error:', error);
      
      if (error.message?.includes('User already registered')) {
        throw new Error('An account with this email already exists. Please try logging in instead.');
      } else if (error.message?.includes('Invalid email')) {
        throw new Error('Please enter a valid email address.');
      } else if (error.message?.includes('Password')) {
        throw new Error('Password must be at least 6 characters long.');
      } else if (error.message?.includes('rate_limit')) {
        throw new Error('Too many registration attempts. Please wait a moment before trying again.');
      } else {
        throw new Error(error.message || 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      console.log('Logging out user');
      await supabase.auth.signOut();
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
