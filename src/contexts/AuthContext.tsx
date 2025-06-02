
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
    console.log('🔄 [AUTH] Redirecting user based on role:', {
      role: userProfile.role, 
      approved: userProfile.approved, 
      userId: userProfile.id
    });
    
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
  };

  // Function to fetch user profile from public.users
  const fetchUserProfile = async (authUser: SupabaseUser): Promise<User | null> => {
    try {
      console.log('🔍 [AUTH] Fetching user profile for:', authUser.id);
      
      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (error) {
        console.error('❌ [AUTH] Error fetching user profile:', error);
        throw error;
      }

      if (!profile) {
        console.error('❌ [AUTH] No profile found for user:', authUser.id);
        return null;
      }

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
    } catch (error: any) {
      console.error('❌ [AUTH] Exception fetching user profile:', error);
      return null;
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

      if (session?.user && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION')) {
        console.log('🔑 [AUTH] User authenticated, fetching profile...');
        setLoading(true);
        
        try {
          const userProfile = await fetchUserProfile(session.user);
          if (mounted) {
            if (userProfile) {
              console.log('✅ [AUTH] Setting user profile in state');
              setUser(userProfile);
              setLoading(false);
              
              // Only redirect if we're on the home page
              if (window.location.pathname === '/') {
                setTimeout(() => {
                  if (mounted) {
                    redirectUser(userProfile);
                  }
                }, 100);
              }
            } else {
              console.error('❌ [AUTH] Failed to fetch user profile - forcing logout');
              setUser(null);
              setLoading(false);
              await supabase.auth.signOut();
            }
          }
        } catch (error) {
          console.error('❌ [AUTH] Error handling authentication:', error);
          if (mounted) {
            setUser(null);
            setLoading(false);
          }
        }
      } else if (event === 'SIGNED_OUT' || !session) {
        console.log('👋 [AUTH] User signed out or no session');
        if (mounted) {
          setUser(null);
          setLoading(false);
          if (event === 'SIGNED_OUT') {
            navigate('/', { replace: true });
          }
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
            email: session.user.email
          });
          
          try {
            const userProfile = await fetchUserProfile(session.user);
            if (mounted) {
              if (userProfile) {
                console.log('✅ [AUTH] Initial profile loaded successfully');
                setUser(userProfile);
                setLoading(false);
                
                // Check if we should redirect from home page
                if (window.location.pathname === '/') {
                  setTimeout(() => {
                    if (mounted) {
                      redirectUser(userProfile);
                    }
                  }, 100);
                }
              } else {
                console.error('❌ [AUTH] Failed to load initial profile');
                setUser(null);
                setLoading(false);
              }
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

    return () => {
      console.log('🧹 [AUTH] Cleaning up auth context...');
      mounted = false;
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
          sessionExists: !!data.session
        });
        // Auth state change handler will handle the rest
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
          },
          emailRedirectTo: window.location.origin
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
        
        // Check if user is automatically logged in
        if (data.session) {
          console.log('✅ [AUTH] User automatically logged in after registration');
          // Auth state change handler will handle profile creation and redirection
        } else {
          console.log('ℹ️ [AUTH] User created but session not established');
          setLoading(false);
        }
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
