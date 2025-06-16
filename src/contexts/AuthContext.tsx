
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { fetchUserProfile } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import type { UserData, AuthContextType } from './auth/types';

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

  const login = async (email: string, password: string) => {
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
  ) => {
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

        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: data.user.id,
            email: email,
            full_name: fullName,
            phone_number: phoneNumber,
            location: location,
            role: role,
            approved: role === 'client',
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

        if (role === 'client') {
          // For clients, sign out and sign back in to trigger proper auth flow
          await supabase.auth.signOut();
          
          setTimeout(async () => {
            const { error: signInError } = await supabase.auth.signInWithPassword({
              email,
              password,
            });

            if (signInError) {
              console.error('❌ [AUTH_CONTEXT] Auto sign-in error:', signInError);
              toast({
                title: "Registration Successful!",
                description: "Your account has been created. Please log in manually.",
              });
            } else {
              toast({
                title: "Welcome!",
                description: "Your account has been created successfully. Welcome to our platform!",
              });
            }
            setWaitingForProfile(false);
          }, 1000);
        } else if (role === 'tasker') {
          toast({
            title: "Registration Successful!",
            description: "Your tasker application has been submitted for review. You'll be notified once approved.",
          });
          setWaitingForProfile(false);
        }

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

  const logout = async () => {
    try {
      console.log('🚪 [AUTH_CONTEXT] Logging out...');
      await supabase.auth.signOut();
      console.log('✅ [AUTH_CONTEXT] Logout successful');
    } catch (error) {
      console.error('❌ [AUTH_CONTEXT] Logout error:', error);
      window.location.href = '/';
    }
  };

  useEffect(() => {
    console.log('🔄 [AUTH_CONTEXT] Setting up auth state listener...');
    
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
          window.location.href = '/';
        }
      }
    );

    // Initialize auth
    const initializeAuth = async () => {
      try {
        console.log('🔍 [AUTH_CONTEXT] Checking for existing session...');
        
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ [AUTH_CONTEXT] Session error:', error);
          setLoading(false);
          return;
        }
        
        if (session?.user) {
          console.log('✅ [AUTH_CONTEXT] Found existing session');
          await loadUserData(session.user);
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
