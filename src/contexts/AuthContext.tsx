
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
  const redirectUser = (userProfile: User, currentPath: string) => {
    console.log('🔄 Redirecting user:', userProfile.role, 'approved:', userProfile.approved, 'currentPath:', currentPath);
    
    // Only redirect if we're on the home page to avoid infinite redirects
    if (currentPath !== '/') {
      console.log('ℹ️ Not redirecting - user not on home page');
      return;
    }
    
    if (userProfile.role === 'admin') {
      navigate('/admin-dashboard', { replace: true });
    } else if (userProfile.role === 'tasker') {
      if (userProfile.approved) {
        navigate('/tasker-dashboard', { replace: true });
      } else {
        navigate('/tasker-pending', { replace: true });
      }
    } else {
      navigate('/client-dashboard', { replace: true });
    }
  };

  // Function to fetch user profile with better error handling
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
          if (mounted && userProfile) {
            setUser(userProfile);
            setLoading(false);
            
            // Get current path and redirect if on home page
            const currentPath = window.location.pathname;
            setTimeout(() => {
              redirectUser(userProfile, currentPath);
            }, 100);
          } else if (mounted) {
            setUser(null);
            setLoading(false);
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
          navigate('/', { replace: true });
        }
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        console.log('🔄 Token refreshed for user:', session.user.id);
        // Don't fetch profile again on token refresh, just update loading state
        if (mounted && !user) {
          setLoading(false);
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
        
        // Create user profile immediately with better debugging
        const profileData = {
          id: data.user.id,
          email: userData.email,
          name: userData.name,
          role: userData.role,
          location: userData.location,
          phone: userData.phone,
          approved: userData.role === 'client' ? true : false,
        };

        console.log('📝 Creating profile with data:', profileData);

        const { data: newProfile, error: profileError } = await supabase
          .from('users')
          .insert(profileData)
          .select()
          .single();

        if (profileError) {
          console.error('❌ Error creating user profile:', profileError);
          setLoading(false);
          throw new Error('Failed to create user profile: ' + profileError.message);
        }

        if (newProfile) {
          console.log('✅ User profile created successfully:', newProfile);
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
          
          setUser(userProfile);
          setLoading(false);
          
          // Redirect immediately for registration
          const currentPath = window.location.pathname;
          setTimeout(() => {
            redirectUser(userProfile, currentPath);
          }, 100);
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
      navigate('/', { replace: true });
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
