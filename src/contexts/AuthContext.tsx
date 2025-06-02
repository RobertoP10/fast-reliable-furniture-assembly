
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import type { User as SupabaseUser } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

type UserRole = Database['public']['Enums']['user_role'];
type DbUser = Database['public']['Tables']['users']['Row'];

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  location?: string;
  phone?: string;
  approved: boolean;
  rating?: number;
  total_reviews?: number;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: Omit<User, 'id' | 'approved' | 'rating' | 'total_reviews'> & { password: string }) => Promise<void>;
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
  const navigate = useNavigate();

  // Function to redirect user based on role and approval status
  const redirectUser = (userProfile: User) => {
    console.log('Redirecting user:', userProfile.role, 'approved:', userProfile.approved);
    
    if (userProfile.role === 'admin') {
      navigate('/admin-dashboard');
    } else if (userProfile.role === 'tasker') {
      if (userProfile.approved) {
        navigate('/tasker-dashboard');
      } else {
        navigate('/tasker-pending');
      }
    } else {
      navigate('/client-dashboard');
    }
  };

  // Function to fetch user profile from database
  const fetchUserProfile = async (authUser: SupabaseUser): Promise<User | null> => {
    try {
      console.log('Fetching user profile for:', authUser.id);
      
      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        return null;
      }

      if (profile) {
        const userProfile: User = {
          id: profile.id,
          email: profile.email,
          name: profile.name,
          role: profile.role,
          location: profile.location || undefined,
          phone: profile.phone || undefined,
          approved: profile.approved,
          rating: profile.rating || undefined,
          total_reviews: profile.total_reviews || undefined,
        };
        
        console.log('User profile fetched:', userProfile);
        return userProfile;
      }

      return null;
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
      return null;
    }
  };

  useEffect(() => {
    let mounted = true;

    // Get initial session
    const getInitialSession = async () => {
      try {
        console.log('Getting initial session...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          if (mounted) {
            setUser(null);
            setLoading(false);
          }
          return;
        }

        if (session?.user) {
          console.log('Initial session found, fetching profile...');
          const userProfile = await fetchUserProfile(session.user);
          if (mounted) {
            setUser(userProfile);
            setLoading(false);
          }
        } else {
          console.log('No initial session found');
          if (mounted) {
            setUser(null);
            setLoading(false);
          }
        }
      } catch (error) {
        console.error('Error in getInitialSession:', error);
        if (mounted) {
          setUser(null);
          setLoading(false);
        }
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.id);
      
      if (!mounted) return;

      if (event === 'SIGNED_IN' && session?.user) {
        console.log('User signed in, fetching profile...');
        const userProfile = await fetchUserProfile(session.user);
        setUser(userProfile);
        setLoading(false);
      } else if (event === 'SIGNED_OUT') {
        console.log('User signed out');
        setUser(null);
        setLoading(false);
        navigate('/');
      } else {
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate]);

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
        throw new Error(error.message);
      }

      if (data.user) {
        console.log('Login successful, fetching profile...');
        const userProfile = await fetchUserProfile(data.user);
        setUser(userProfile);
        if (userProfile) {
          redirectUser(userProfile);
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: Omit<User, 'id' | 'approved' | 'rating' | 'total_reviews'> & { password: string }) => {
    setLoading(true);
    try {
      console.log('Attempting registration for:', userData.email, 'as', userData.role);
      
      // Register user with autoConfirm to skip email verification
      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          emailRedirectTo: undefined, // No email confirmation needed
          data: {
            name: userData.name,
            role: userData.role,
            location: userData.location,
            phone: userData.phone,
          }
        }
      });

      if (error) {
        console.error('Registration error:', error);
        throw new Error(error.message);
      }

      if (data.user) {
        console.log('Registration successful, user created:', data.user.id);
        
        // Wait for the trigger to create the user profile
        let attempts = 0;
        let userProfile = null;
        
        while (attempts < 10 && !userProfile) {
          await new Promise(resolve => setTimeout(resolve, 500));
          userProfile = await fetchUserProfile(data.user);
          attempts++;
          console.log(`Attempt ${attempts} to fetch user profile...`);
        }
        
        if (userProfile) {
          console.log('User profile created successfully:', userProfile);
          setUser(userProfile);
          redirectUser(userProfile);
        } else {
          console.error('Failed to create user profile after registration');
          throw new Error('Failed to create user profile');
        }
      }
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      console.log('Logging out...');
      await supabase.auth.signOut();
      setUser(null);
      navigate('/');
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
