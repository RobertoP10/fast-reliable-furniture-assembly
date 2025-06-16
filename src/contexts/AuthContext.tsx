
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { validateUserSession, fetchUserProfile } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';

interface UserData {
  id: string;
  email: string;
  full_name: string;
  role: string;
  approved: boolean;
  created_at: string;
  updated_at: string;
  rating?: number;
  total_reviews?: number;
  phone_number?: string;
  location?: string;
  terms_accepted?: boolean;
  terms_accepted_at?: string;
}

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
  waitingForProfile: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string, fullName: string, phoneNumber: string, location: string, role: 'client' | 'tasker', termsAccepted: boolean) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
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
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [waitingForProfile, setWaitingForProfile] = useState(false);
  const { toast } = useToast();

  // Load user session and profile data
  const loadUserData = async (currentUser: User | null) => {
    console.log('🔄 [AUTH_CONTEXT] Loading user data for:', currentUser?.id || 'no user');
    
    if (!currentUser) {
      setUser(null);
      setUserData(null);
      setLoading(false);
      return;
    }

    try {
      const profile = await fetchUserProfile(currentUser);
      
      if (profile) {
        console.log('✅ [AUTH_CONTEXT] Profile loaded successfully:', profile.role);
        setUser(currentUser);
        setUserData(profile);
      } else {
        console.warn('⚠️ [AUTH_CONTEXT] No profile found for user');
        setUser(currentUser);
        setUserData(null);
      }
    } catch (error) {
      console.error('❌ [AUTH_CONTEXT] Error loading profile:', error);
      setUser(currentUser);
      setUserData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('🔄 [AUTH_CONTEXT] Setting up auth state listener...');
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔔 [AUTH_CONTEXT] Auth state changed:', event, session?.user?.id || 'no user');
        
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          if (session?.user) {
            await loadUserData(session.user);
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setUserData(null);
          setLoading(false);
        }
      }
    );

    // Check for existing session
    const initializeAuth = async () => {
      try {
        console.log('🔍 [AUTH_CONTEXT] Checking for existing session...');
        const sessionData = await validateUserSession();
        
        if (sessionData?.session?.user) {
          console.log('✅ [AUTH_CONTEXT] Found existing session');
          await loadUserData(sessionData.session.user);
        } else {
          console.log('ℹ️ [AUTH_CONTEXT] No existing session found');
          setLoading(false);
        }
      } catch (error) {
        console.error('❌ [AUTH_CONTEXT] Error initializing auth:', error);
        setLoading(false);
      }
    };

    initializeAuth();

    return () => {
      console.log('🧹 [AUTH_CONTEXT] Cleaning up auth listener');
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('🔐 [AUTH_CONTEXT] Attempting login for:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('❌ [AUTH_CONTEXT] Login error:', error);
        return { success: false, error: error.message };
      }

      if (data.user) {
        console.log('✅ [AUTH_CONTEXT] Login successful');
        // loadUserData will be called by the auth state change listener
        return { success: true };
      }

      return { success: false, error: 'Login failed' };
    } catch (error: any) {
      console.error('❌ [AUTH_CONTEXT] Login exception:', error);
      return { success: false, error: error.message || 'Login failed' };
    }
  };

  const register = async (
    email: string, 
    password: string, 
    fullName: string, 
    phoneNumber: string, 
    location: string, 
    role: 'client' | 'tasker',
    termsAccepted: boolean
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('📝 [AUTH_CONTEXT] Attempting registration for:', email, 'as', role);
      setWaitingForProfile(true);

      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName,
            phone_number: phoneNumber,
            location: location,
            role: role,
            terms_accepted: termsAccepted,
            terms_accepted_at: new Date().toISOString()
          }
        }
      });

      if (error) {
        console.error('❌ [AUTH_CONTEXT] Registration error:', error);
        setWaitingForProfile(false);
        return { success: false, error: error.message };
      }

      if (data.user) {
        console.log('✅ [AUTH_CONTEXT] Registration successful, creating profile...');

        // Create user profile immediately
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: data.user.id,
            email: email,
            full_name: fullName,
            phone_number: phoneNumber,
            location: location,
            role: role,
            approved: role === 'client', // Auto-approve clients, taskers need manual approval
            terms_accepted: termsAccepted,
            terms_accepted_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (profileError) {
          console.error('❌ [AUTH_CONTEXT] Profile creation error:', profileError);
          setWaitingForProfile(false);
          return { success: false, error: 'Failed to create user profile' };
        }

        console.log('✅ [AUTH_CONTEXT] Profile created successfully');

        // For clients, automatically sign them in
        if (role === 'client') {
          console.log('🔄 [AUTH_CONTEXT] Auto-signing in client...');
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (signInError) {
            console.error('❌ [AUTH_CONTEXT] Auto sign-in error:', signInError);
            setWaitingForProfile(false);
            return { success: false, error: 'Registration successful but auto sign-in failed. Please log in manually.' };
          }
        }

        // Show appropriate success message
        if (role === 'tasker') {
          toast({
            title: "Registration Successful!",
            description: "Your tasker application has been submitted for review. You'll be notified once approved.",
          });
        } else {
          toast({
            title: "Welcome!",
            description: "Your account has been created successfully. Welcome to our platform!",
          });
        }

        setWaitingForProfile(false);
        return { success: true };
      }

      setWaitingForProfile(false);
      return { success: false, error: 'Registration failed' };
    } catch (error: any) {
      console.error('❌ [AUTH_CONTEXT] Registration exception:', error);
      setWaitingForProfile(false);
      return { success: false, error: error.message || 'Registration failed' };
    }
  };

  const logout = async (): Promise<void> => {
    try {
      console.log('🚪 [AUTH_CONTEXT] Logging out...');
      await supabase.auth.signOut();
      setUser(null);
      setUserData(null);
      console.log('✅ [AUTH_CONTEXT] Logout successful');
    } catch (error) {
      console.error('❌ [AUTH_CONTEXT] Logout error:', error);
    }
  };

  const value: AuthContextType = {
    user,
    userData,
    loading,
    waitingForProfile,
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
