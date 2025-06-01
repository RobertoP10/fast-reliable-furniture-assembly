
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'client' | 'tasker' | 'admin';
  location?: string;
  approved?: boolean | null;
  phone?: string;
  profile_photo?: string;
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

  const fetchUserProfile = async (userId: string) => {
    try {
      console.log('Fetching user profile for:', userId);
      const { data: userData, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('Error fetching user data:', error);
        return null;
      }

      if (userData) {
        const userObj: User = {
          id: userData.id,
          email: userData.email || '',
          name: userData.name || '',
          role: userData.role as 'client' | 'tasker' | 'admin',
          location: userData.location || undefined,
          approved: userData.approved === 'true' ? true : userData.approved === 'false' ? false : null,
          phone: userData.phone || undefined,
          profile_photo: userData.profile_photo || undefined,
        };
        console.log('User profile loaded:', userObj);
        setUser(userObj);
        return userObj;
      }
      return null;
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
      return null;
    }
  };

  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      try {
        // Get initial session
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting initial session:', error);
          if (isMounted) {
            setLoading(false);
          }
          return;
        }

        console.log('Initial session:', initialSession?.user?.id);
        
        if (isMounted) {
          setSession(initialSession);
          
          if (initialSession?.user) {
            await fetchUserProfile(initialSession.user.id);
          }
          
          setLoading(false);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        
        if (!isMounted) return;
        
        setSession(session);
        
        if (session?.user) {
          // Defer the profile fetch to avoid blocking the auth state change
          setTimeout(async () => {
            if (isMounted) {
              await fetchUserProfile(session.user.id);
            }
          }, 0);
        } else {
          setUser(null);
        }
      }
    );

    // Initialize auth
    initializeAuth();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
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
      
      console.log('Login successful:', data.user?.id);
      // User profile will be fetched in the auth state change handler
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const register = async (userData: Omit<User, 'id'> & { password: string }) => {
    try {
      console.log('Attempting registration for:', userData.email);
      
      // First create the auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`
        }
      });
      
      if (authError) {
        console.error('Registration auth error:', authError);
        throw authError;
      }

      if (authData.user) {
        console.log('Auth user created, inserting profile data...');
        
        // Insert user data into our users table
        const { error: insertError } = await supabase
          .from('users')
          .insert({
            id: authData.user.id,
            email: userData.email,
            name: userData.name,
            role: userData.role,
            location: userData.location,
            phone: userData.phone,
            approved: userData.role === 'tasker' ? null : 'true',
            created_at: new Date().toISOString()
          });

        if (insertError) {
          console.error('Error inserting user data:', insertError);
          throw insertError;
        }

        console.log('Registration successful, user data inserted');
      }
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  };

  const logout = async () => {
    console.log('Logging out...');
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
