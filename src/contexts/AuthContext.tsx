
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
    console.log('🔄 Redirecting user:', userProfile.role, 'approved:', userProfile.approved);
    
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

  // Function to fetch user profile
  const fetchUserProfile = async (authUser: SupabaseUser): Promise<User | null> => {
    try {
      console.log(`🔍 Fetching user profile for: ${authUser.id}`);
      
      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (error) {
        console.error('❌ Error fetching user profile:', error);
        
        // If profile doesn't exist, create one
        if (error.code === 'PGRST116') {
          console.log('📝 Profile not found, creating default profile...');
          const { data: newProfile, error: insertError } = await supabase
            .from('users')
            .insert({
              id: authUser.id,
              email: authUser.email || '',
              name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User',
              role: 'client' as UserRole,
              approved: true
            })
            .select()
            .single();

          if (insertError) {
            console.error('❌ Error creating user profile:', insertError);
            return null;
          }

          if (newProfile) {
            console.log('✅ Default profile created successfully:', newProfile);
            const userProfile: User = {
              id: newProfile.id,
              email: newProfile.email,
              name: newProfile.name,
              role: newProfile.role,
              location: newProfile.location || undefined,
              phone: newProfile.phone || undefined,
              approved: newProfile.approved,
              rating: newProfile.rating || undefined,
              total_reviews: newProfile.total_reviews || undefined,
            };
            return userProfile;
          }
        }
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
        
        console.log('✅ User profile fetched successfully:', userProfile);
        return userProfile;
      }

      return null;
    } catch (error) {
      console.error('❌ Exception in fetchUserProfile:', error);
      return null;
    }
  };

  useEffect(() => {
    let mounted = true;
    console.log('🚀 Initializing authentication...');

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Auth state changed:', event, session?.user?.id || 'no user');
      
      if (!mounted) return;

      if (event === 'SIGNED_IN' && session?.user) {
        console.log('🔑 User signed in, fetching profile...');
        
        try {
          const userProfile = await fetchUserProfile(session.user);
          if (mounted) {
            setUser(userProfile);
            setLoading(false);
            
            // Only redirect if we're on the home page
            if (userProfile && window.location.pathname === '/') {
              redirectUser(userProfile);
            }
          }
        } catch (error) {
          console.error('❌ Error handling sign in:', error);
          if (mounted) {
            setUser(null);
            setLoading(false);
          }
        }
      } else if (event === 'SIGNED_OUT') {
        console.log('👋 User signed out');
        if (mounted) {
          setUser(null);
          setLoading(false);
          navigate('/');
        }
      }
    });

    // Get initial session
    const initializeSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Error getting session:', error);
          if (mounted) {
            setUser(null);
            setLoading(false);
          }
          return;
        }

        if (session?.user && mounted) {
          console.log('✅ Initial session found, fetching profile...');
          try {
            const userProfile = await fetchUserProfile(session.user);
            if (mounted) {
              setUser(userProfile);
              setLoading(false);
            }
          } catch (error) {
            console.error('❌ Error fetching initial profile:', error);
            if (mounted) {
              setUser(null);
              setLoading(false);
            }
          }
        } else {
          console.log('ℹ️ No initial session found');
          if (mounted) {
            setUser(null);
            setLoading(false);
          }
        }
      } catch (error) {
        console.error('❌ Error in initializeSession:', error);
        if (mounted) {
          setUser(null);
          setLoading(false);
        }
      }
    };

    initializeSession();

    return () => {
      console.log('🧹 Cleaning up auth context...');
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate]);

  const login = async (email: string, password: string) => {
    console.log('🔐 Attempting login for:', email);
    setLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('❌ Login error:', error);
        setLoading(false);
        throw new Error(error.message);
      }

      if (data.user) {
        console.log('✅ Login successful for user:', data.user.id);
        // Don't fetch profile here, let the auth state change handler do it
      }
    } catch (error) {
      console.error('❌ Login error:', error);
      setLoading(false);
      throw error;
    }
  };

  const register = async (userData: Omit<User, 'id' | 'approved' | 'rating' | 'total_reviews'> & { password: string }) => {
    console.log('📝 Attempting registration for:', userData.email, 'as', userData.role);
    setLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            name: userData.name,
            role: userData.role,
            location: userData.location,
            phone: userData.phone,
          }
        }
      });

      if (error) {
        console.error('❌ Registration error:', error);
        setLoading(false);
        throw new Error(error.message);
      }

      if (data.user) {
        console.log('✅ Registration successful, creating user profile...');
        
        // Create user profile immediately
        const { data: profileData, error: profileError } = await supabase
          .from('users')
          .insert({
            id: data.user.id,
            email: userData.email,
            name: userData.name,
            role: userData.role,
            location: userData.location,
            phone: userData.phone,
            approved: userData.role === 'client' ? true : false,
          })
          .select()
          .single();

        if (profileError) {
          console.error('❌ Error creating user profile:', profileError);
          setLoading(false);
          throw new Error('Failed to create user profile');
        }

        if (profileData) {
          const userProfile: User = {
            id: profileData.id,
            email: profileData.email,
            name: profileData.name,
            role: profileData.role,
            location: profileData.location || undefined,
            phone: profileData.phone || undefined,
            approved: profileData.approved,
            rating: profileData.rating || undefined,
            total_reviews: profileData.total_reviews || undefined,
          };
          
          console.log('✅ User profile created successfully:', userProfile);
          setUser(userProfile);
          setLoading(false);
          redirectUser(userProfile);
        }
      }
    } catch (error) {
      console.error('❌ Registration error:', error);
      setLoading(false);
      throw error;
    }
  };

  const logout = async () => {
    try {
      console.log('👋 Logging out...');
      setLoading(true);
      await supabase.auth.signOut();
      setUser(null);
      setLoading(false);
      navigate('/');
    } catch (error) {
      console.error('❌ Logout error:', error);
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
