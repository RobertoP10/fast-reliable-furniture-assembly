
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
  const [initialCheckDone, setInitialCheckDone] = useState(false);
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

  // Function to fetch user profile from database with improved error handling
  const fetchUserProfile = async (authUser: SupabaseUser, retryCount = 0): Promise<User | null> => {
    const maxRetries = 3;
    
    try {
      console.log(`🔍 Fetching user profile for: ${authUser.id} (attempt ${retryCount + 1})`);
      
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
        
        // Retry on other errors
        if (retryCount < maxRetries) {
          console.log(`🔄 Retrying profile fetch in 1 second... (${retryCount + 1}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, 1000));
          return fetchUserProfile(authUser, retryCount + 1);
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
      
      // Retry on exceptions
      if (retryCount < maxRetries) {
        console.log(`🔄 Retrying after exception in 1 second... (${retryCount + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        return fetchUserProfile(authUser, retryCount + 1);
      }
      
      return null;
    }
  };

  useEffect(() => {
    let mounted = true;
    let authSubscription: any = null;

    // Get initial session
    const getInitialSession = async () => {
      try {
        console.log('🚀 Getting initial session...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Error getting session:', error);
          if (mounted) {
            setUser(null);
            setLoading(false);
            setInitialCheckDone(true);
          }
          return;
        }

        if (session?.user) {
          console.log('✅ Initial session found, fetching profile...');
          const userProfile = await fetchUserProfile(session.user);
          if (mounted) {
            setUser(userProfile);
            setLoading(false);
            setInitialCheckDone(true);
          }
        } else {
          console.log('ℹ️ No initial session found');
          if (mounted) {
            setUser(null);
            setLoading(false);
            setInitialCheckDone(true);
          }
        }
      } catch (error) {
        console.error('❌ Error in getInitialSession:', error);
        if (mounted) {
          setUser(null);
          setLoading(false);
          setInitialCheckDone(true);
        }
      }
    };

    // Set up auth state listener
    const setupAuthListener = () => {
      console.log('👂 Setting up auth state listener...');
      authSubscription = supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('🔄 Auth state changed:', event, session?.user?.id || 'no user');
        
        if (!mounted) return;

        if (event === 'SIGNED_IN' && session?.user) {
          console.log('🔑 User signed in, fetching profile...');
          setLoading(true);
          const userProfile = await fetchUserProfile(session.user);
          if (mounted) {
            setUser(userProfile);
            setLoading(false);
          }
        } else if (event === 'SIGNED_OUT') {
          console.log('👋 User signed out');
          if (mounted) {
            setUser(null);
            setLoading(false);
            navigate('/');
          }
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          console.log('🔄 Token refreshed');
          // Don't fetch profile again on token refresh if we already have a user
          if (!user && mounted) {
            const userProfile = await fetchUserProfile(session.user);
            if (mounted) {
              setUser(userProfile);
              setLoading(false);
            }
          }
        } else {
          if (mounted && !initialCheckDone) {
            setLoading(false);
            setInitialCheckDone(true);
          }
        }
      });
    };

    // Execute initialization
    setupAuthListener();
    getInitialSession();

    return () => {
      console.log('🧹 Cleaning up auth context...');
      mounted = false;
      if (authSubscription) {
        authSubscription.unsubscribe();
      }
    };
  }, [navigate, initialCheckDone]);

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
        console.log('✅ Login successful, fetching profile...');
        const userProfile = await fetchUserProfile(data.user);
        if (userProfile) {
          setUser(userProfile);
          redirectUser(userProfile);
        } else {
          console.error('❌ Failed to fetch user profile after login');
          throw new Error('Failed to load user profile');
        }
      }
    } catch (error) {
      console.error('❌ Login error:', error);
      setLoading(false);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: Omit<User, 'id' | 'approved' | 'rating' | 'total_reviews'> & { password: string }) => {
    console.log('📝 Attempting registration for:', userData.email, 'as', userData.role);
    setLoading(true);
    
    try {
      // Sign up with autoConfirm
      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          emailRedirectTo: undefined,
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
            approved: userData.role === 'client' ? true : false, // Clients auto-approved, taskers need approval
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
          redirectUser(userProfile);
        }
      }
    } catch (error) {
      console.error('❌ Registration error:', error);
      setLoading(false);
      throw error;
    } finally {
      setLoading(false);
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
