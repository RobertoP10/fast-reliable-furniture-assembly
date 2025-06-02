
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
  const [isRedirecting, setIsRedirecting] = useState(false);
  const navigate = useNavigate();

  // Function to redirect user based on role and approval status
  const redirectUser = (userProfile: User, currentPath: string) => {
    console.log('🔄 [AUTH] Attempting to redirect user:', {
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
    
    // Prevent multiple redirects
    if (isRedirecting) {
      console.log('ℹ️ [AUTH] Already redirecting, skipping');
      return;
    }

    setIsRedirecting(true);
    
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
      setIsRedirecting(false);
    }
  };

  // Function to fetch user profile with retry logic
  const fetchUserProfileWithRetry = async (authUser: SupabaseUser, maxRetries = 5): Promise<User | null> => {
    let retryCount = 0;
    
    while (retryCount < maxRetries) {
      try {
        console.log(`🔍 [AUTH] Fetching user profile (attempt ${retryCount + 1}/${maxRetries}) for: ${authUser.id}`);
        
        const { data: profile, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .single();

        if (!error && profile) {
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

        if (error && error.code === 'PGRST116') {
          console.log(`⏳ [AUTH] Profile not found (attempt ${retryCount + 1}), waiting for trigger...`);
          retryCount++;
          
          if (retryCount < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
            continue;
          }
        } else if (error) {
          console.error('❌ [AUTH] Error fetching user profile:', error);
          throw error;
        }
      } catch (error: any) {
        console.error(`❌ [AUTH] Exception in fetchUserProfile (attempt ${retryCount + 1}):`, error);
        retryCount++;
        
        if (retryCount < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
          continue;
        }
        throw error;
      }
    }

    console.error('❌ [AUTH] Failed to fetch profile after all retries');
    return null;
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
        accessToken: session?.access_token ? 'present' : 'missing',
        userMetadata: session?.user?.user_metadata || 'none',
        emailConfirmed: session?.user?.email_confirmed_at ? 'confirmed' : 'not confirmed'
      });
      
      if (!mounted) {
        console.log('⚠️ [AUTH] Component unmounted, ignoring auth state change');
        return;
      }

      if (session?.user && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION')) {
        console.log('🔑 [AUTH] User authenticated, fetching profile with retry...');
        setLoading(true);
        setIsRedirecting(false);
        
        try {
          const userProfile = await fetchUserProfileWithRetry(session.user);
          if (mounted && userProfile) {
            console.log('✅ [AUTH] Setting user profile in state');
            setUser(userProfile);
            setLoading(false);
            
            // Get current path and redirect if on home page
            const currentPath = window.location.pathname;
            console.log('📍 [AUTH] Current path:', currentPath);
            
            // Delay redirect slightly to ensure state is set
            setTimeout(() => {
              if (mounted) {
                redirectUser(userProfile, currentPath);
              }
            }, 100);
          } else if (mounted) {
            console.log('❌ [AUTH] Failed to fetch user profile after retries');
            setUser(null);
            setLoading(false);
            setIsRedirecting(false);
          }
        } catch (error) {
          console.error('❌ [AUTH] Error handling authentication:', error);
          if (mounted) {
            setUser(null);
            setLoading(false);
            setIsRedirecting(false);
          }
        }
      } else if (event === 'SIGNED_OUT' || !session) {
        console.log('👋 [AUTH] User signed out or no session');
        if (mounted) {
          setUser(null);
          setLoading(false);
          setIsRedirecting(false);
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
            setIsRedirecting(false);
          }
          return;
        }

        if (session?.user && mounted) {
          console.log('✅ [AUTH] Initial session found:', {
            userId: session.user.id,
            email: session.user.email,
            accessToken: session.access_token ? 'present' : 'missing',
            userMetadata: session.user.user_metadata || 'none',
            emailConfirmed: session.user.email_confirmed_at ? 'confirmed' : 'not confirmed'
          });
          
          try {
            const userProfile = await fetchUserProfileWithRetry(session.user);
            if (mounted) {
              if (userProfile) {
                console.log('✅ [AUTH] Initial profile loaded successfully');
                setUser(userProfile);
                setLoading(false);
                
                // Check if we should redirect
                const currentPath = window.location.pathname;
                if (currentPath === '/') {
                  setTimeout(() => {
                    if (mounted) {
                      redirectUser(userProfile, currentPath);
                    }
                  }, 100);
                }
              } else {
                console.log('❌ [AUTH] Failed to load initial profile');
                setUser(null);
                setLoading(false);
                setIsRedirecting(false);
              }
            }
          } catch (error) {
            console.error('❌ [AUTH] Error fetching initial profile:', error);
            if (mounted) {
              setUser(null);
              setLoading(false);
              setIsRedirecting(false);
            }
          }
        } else {
          console.log('ℹ️ [AUTH] No initial session found');
          if (mounted) {
            setUser(null);
            setLoading(false);
            setIsRedirecting(false);
          }
        }
      } catch (error: any) {
        console.error('❌ [AUTH] Error in initializeSession:', error);
        if (mounted) {
          setUser(null);
          setLoading(false);
          setIsRedirecting(false);
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
    setIsRedirecting(false);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('❌ [AUTH] Login error:', error);
        setLoading(false);
        setIsRedirecting(false);
        
        // Handle unverified email error specifically
        if (error.message.includes('Email not confirmed')) {
          throw new Error('Your email has not been verified. Please check your inbox or register again.');
        }
        
        throw new Error(error.message);
      }

      if (data.user && data.session) {
        console.log('✅ [AUTH] Login successful:', {
          userId: data.user.id,
          sessionExists: !!data.session,
          accessToken: data.session.access_token ? 'present' : 'missing',
          emailConfirmed: data.user.email_confirmed_at ? 'confirmed' : 'not confirmed'
        });
        // Auth state change handler will handle the rest
      }
    } catch (error) {
      console.error('❌ [AUTH] Login error:', error);
      setLoading(false);
      setIsRedirecting(false);
      throw error;
    }
  };

  const register = async (userData: Omit<User, 'id' | 'approved' | 'rating' | 'total_reviews'> & { password: string }) => {
    console.log('📝 [AUTH] Attempting registration for:', userData.email, 'as', userData.role);
    setLoading(true);
    setIsRedirecting(false);
    
    try {
      // Sign up with email confirmation disabled
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
        setIsRedirecting(false);
        throw new Error(error.message);
      }

      if (data.user) {
        console.log('✅ [AUTH] Registration successful for user:', data.user.id);
        console.log('🔍 [AUTH] User metadata:', data.user.user_metadata);
        console.log('🔍 [AUTH] User session:', data.session ? 'present' : 'not present');
        console.log('🔍 [AUTH] Email confirmed:', data.user.email_confirmed_at ? 'yes' : 'no');
        
        // Check if user is automatically logged in
        if (data.session) {
          console.log('✅ [AUTH] User automatically logged in after registration');
          // Auth state change handler will handle profile creation and redirection
        } else {
          console.log('ℹ️ [AUTH] User created but session not established');
          setLoading(false);
          setIsRedirecting(false);
        }
      }
    } catch (error) {
      console.error('❌ [AUTH] Registration error:', error);
      setLoading(false);
      setIsRedirecting(false);
      throw error;
    }
  };

  const logout = async () => {
    try {
      console.log('👋 [AUTH] Logging out...');
      setLoading(true);
      setIsRedirecting(false);
      await supabase.auth.signOut();
      setUser(null);
      setLoading(false);
      navigate('/', { replace: true });
    } catch (error) {
      console.error('❌ [AUTH] Logout error:', error);
      setLoading(false);
      setIsRedirecting(false);
    }
  };

  console.log('🔄 [AUTH] Current auth state:', {
    user: user?.id || 'none',
    loading,
    isRedirecting,
    role: user?.role || 'none',
    approved: user?.approved || false
  });

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
