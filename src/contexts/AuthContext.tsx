
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
    console.log('🔄 [AUTH] Redirecting user:', {
      role: userProfile.role, 
      approved: userProfile.approved, 
      currentPath,
      userId: userProfile.id
    });
    
    // Only redirect if we're on the home page to avoid infinite redirects
    if (currentPath !== '/') {
      console.log('ℹ️ [AUTH] Not redirecting - user not on home page');
      return;
    }
    
    try {
      if (userProfile.role === 'admin') {
        console.log('👨‍💼 [AUTH] Redirecting admin to admin dashboard');
        navigate('/admin-dashboard', { replace: true });
      } else if (userProfile.role === 'tasker') {
        if (userProfile.approved) {
          console.log('👷 [AUTH] Redirecting approved tasker to dashboard');
          navigate('/tasker-dashboard', { replace: true });
        } else {
          console.log('⏳ [AUTH] Redirecting unapproved tasker to pending page');
          navigate('/tasker-pending', { replace: true });
        }
      } else {
        console.log('👤 [AUTH] Redirecting client to dashboard');
        navigate('/client-dashboard', { replace: true });
      }
    } catch (error) {
      console.error('❌ [AUTH] Error during navigation:', error);
    }
  };

  // Function to fetch user profile with better error handling
  const fetchUserProfile = async (authUser: SupabaseUser): Promise<User | null> => {
    try {
      console.log(`🔍 [AUTH] Fetching user profile for: ${authUser.id}`);
      
      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (error) {
        console.error('❌ [AUTH] Error fetching user profile:', error);
        
        // If profile doesn't exist, create one
        if (error.code === 'PGRST116') {
          console.log('📝 [AUTH] Profile not found, creating default profile...');
          
          const newProfileData = {
            id: authUser.id,
            email: authUser.email || '',
            name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User',
            role: (authUser.user_metadata?.role as UserRole) || 'client',
            location: authUser.user_metadata?.location || null,
            phone: authUser.user_metadata?.phone || null,
            approved: (authUser.user_metadata?.role === 'tasker') ? false : true
          };

          console.log('📝 [AUTH] Creating profile with data:', newProfileData);

          const { data: newProfile, error: insertError } = await supabase
            .from('users')
            .insert(newProfileData)
            .select()
            .single();

          if (insertError) {
            console.error('❌ [AUTH] Error creating user profile:', insertError);
            throw new Error('Failed to create profile');
          }

          if (newProfile) {
            console.log('✅ [AUTH] Default profile created successfully:', newProfile);
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
        
        throw error;
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
        
        console.log('✅ [AUTH] User profile fetched successfully:', {
          id: userProfile.id,
          role: userProfile.role,
          approved: userProfile.approved
        });
        return userProfile;
      }

      console.log('⚠️ [AUTH] No profile data returned');
      return null;
    } catch (error: any) {
      console.error('❌ [AUTH] Exception in fetchUserProfile:', error);
      throw error;
    }
  };

  useEffect(() => {
    let mounted = true;
    console.log('🚀 [AUTH] Initializing authentication context...');

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 [AUTH] Auth state changed:', {
        event,
        userId: session?.user?.id || 'no user',
        sessionExists: !!session,
        accessToken: session?.access_token ? 'present' : 'missing'
      });
      
      if (!mounted) {
        console.log('⚠️ [AUTH] Component unmounted, ignoring auth state change');
        return;
      }

      if (event === 'SIGNED_IN' && session?.user) {
        console.log('🔑 [AUTH] User signed in, fetching profile...');
        setLoading(true);
        
        try {
          const userProfile = await fetchUserProfile(session.user);
          if (mounted) {
            if (userProfile) {
              console.log('✅ [AUTH] Setting user profile in state');
              setUser(userProfile);
              setLoading(false);
              
              // Get current path and redirect if on home page
              const currentPath = window.location.pathname;
              console.log('📍 [AUTH] Current path:', currentPath);
              setTimeout(() => {
                redirectUser(userProfile, currentPath);
              }, 100);
            } else {
              console.log('❌ [AUTH] Failed to fetch user profile');
              setUser(null);
              setLoading(false);
            }
          }
        } catch (error) {
          console.error('❌ [AUTH] Error handling sign in:', error);
          if (mounted) {
            setUser(null);
            setLoading(false);
          }
        }
      } else if (event === 'SIGNED_OUT') {
        console.log('👋 [AUTH] User signed out');
        if (mounted) {
          setUser(null);
          setLoading(false);
          navigate('/', { replace: true });
        }
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        console.log('🔄 [AUTH] Token refreshed for user:', session.user.id);
        // Don't fetch profile again on token refresh if we already have a user
        if (mounted && !user) {
          console.log('🔄 [AUTH] Token refreshed but no user in state, fetching profile...');
          try {
            const userProfile = await fetchUserProfile(session.user);
            if (userProfile) {
              setUser(userProfile);
            }
          } catch (error) {
            console.error('❌ [AUTH] Error fetching profile on token refresh:', error);
          }
          setLoading(false);
        }
      } else if (!session) {
        console.log('📭 [AUTH] No session, user logged out');
        if (mounted) {
          setUser(null);
          setLoading(false);
        }
      }
    });

    // Get initial session
    const initializeSession = async () => {
      try {
        console.log('🔍 [AUTH] Getting initial session...');
        
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ [AUTH] Error getting session:', error);
          if (mounted) {
            setUser(null);
            setLoading(false);
          }
          return;
        }

        if (session?.user && mounted) {
          console.log('✅ [AUTH] Initial session found:', {
            userId: session.user.id,
            email: session.user.email,
            accessToken: session.access_token ? 'present' : 'missing'
          });
          
          try {
            const userProfile = await fetchUserProfile(session.user);
            if (mounted) {
              if (userProfile) {
                console.log('✅ [AUTH] Initial profile loaded successfully');
                setUser(userProfile);
              } else {
                console.log('❌ [AUTH] Failed to load initial profile');
                setUser(null);
              }
              setLoading(false);
            }
          } catch (error) {
            console.error('❌ [AUTH] Error fetching initial profile:', error);
            if (mounted) {
              setUser(null);
              setLoading(false);
            }
          }
        } else {
          console.log('ℹ️ [AUTH] No initial session found');
          if (mounted) {
            setUser(null);
            setLoading(false);
          }
        }
      } catch (error: any) {
        console.error('❌ [AUTH] Error in initializeSession:', error);
        if (mounted) {
          setUser(null);
          setLoading(false);
        }
      }
    };

    initializeSession();

    // Set a maximum loading timeout as a safety net
    const maxLoadingTimeout = setTimeout(() => {
      if (mounted && loading) {
        console.warn('⚠️ [AUTH] Maximum loading timeout reached, forcing loading to false');
        setLoading(false);
      }
    }, 10000); // 10 seconds max loading time

    return () => {
      console.log('🧹 [AUTH] Cleaning up auth context...');
      mounted = false;
      clearTimeout(maxLoadingTimeout);
      subscription.unsubscribe();
    };
  }, [navigate]);

  const login = async (email: string, password: string) => {
    console.log('🔐 [AUTH] Attempting login for:', email);
    setLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('❌ [AUTH] Login error:', error);
        setLoading(false);
        throw new Error(error.message);
      }

      if (data.user && data.session) {
        console.log('✅ [AUTH] Login successful:', {
          userId: data.user.id,
          sessionExists: !!data.session,
          accessToken: data.session.access_token ? 'present' : 'missing'
        });
        // Don't set loading to false here, let the auth state change handler do it
      }
    } catch (error) {
      console.error('❌ [AUTH] Login error:', error);
      setLoading(false);
      throw error;
    }
  };

  const register = async (userData: Omit<User, 'id' | 'approved' | 'rating' | 'total_reviews'> & { password: string }) => {
    console.log('📝 [AUTH] Attempting registration for:', userData.email, 'as', userData.role);
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
        console.error('❌ [AUTH] Registration error:', error);
        setLoading(false);
        throw new Error(error.message);
      }

      if (data.user) {
        console.log('✅ [AUTH] Registration successful for user:', data.user.id);
        console.log('🔍 [AUTH] User metadata:', data.user.user_metadata);
        
        // The auth state change handler will handle profile creation and redirection
        // Don't set loading to false here, let the handler do it
      }
    } catch (error) {
      console.error('❌ [AUTH] Registration error:', error);
      setLoading(false);
      throw error;
    }
  };

  const logout = async () => {
    try {
      console.log('👋 [AUTH] Logging out...');
      setLoading(true);
      await supabase.auth.signOut();
      setUser(null);
      setLoading(false);
      navigate('/', { replace: true });
    } catch (error) {
      console.error('❌ [AUTH] Logout error:', error);
      setLoading(false);
    }
  };

  console.log('🔄 [AUTH] Current auth state:', {
    user: user?.id || 'none',
    loading,
    role: user?.role || 'none',
    approved: user?.approved || false
  });

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
