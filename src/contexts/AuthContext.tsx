
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
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

  const fetchUserProfile = async (authUser: User) => {
    try {
      console.log('🔍 [AUTH] Fetching profile for user:', authUser.id);
      
      const { data, error } = await supabase
        .from('users')
        .select('id, email, full_name, role, approved, created_at, updated_at, rating, total_reviews')
        .eq('id', authUser.id)
        .maybeSingle();

      if (error) {
        console.error('❌ [AUTH] Error fetching user profile:', error);
        return null;
      }

      if (!data) {
        console.warn('⚠️ [AUTH] No profile found for user:', authUser.id);
        return null;
      }

      console.log('✅ [AUTH] Fetched user profile successfully:', {
        id: data.id,
        role: data.role,
        approved: data.approved,
        email: data.email
      });
      
      return data;
    } catch (error: any) {
      console.error('❌ [AUTH] Exception in fetchUserProfile:', error);
      return null;
    }
  };

  const loadUserData = async (currentUser: User | null) => {
    console.log('🔄 [AUTH] Loading user data for:', currentUser?.id || 'no user');
    
    if (!currentUser) {
      setUser(null);
      setUserData(null);
      setLoading(false);
      return;
    }

    try {
      const profile = await fetchUserProfile(currentUser);
      
      if (profile) {
        console.log('✅ [AUTH] Profile loaded successfully:', profile.role);
        setUser(currentUser);
        setUserData(profile);
      } else {
        console.warn('⚠️ [AUTH] No profile found for user');
        setUser(currentUser);
        setUserData(null);
      }
    } catch (error) {
      console.error('❌ [AUTH] Error loading profile:', error);
      setUser(currentUser);
      setUserData(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      console.log('🔐 [AUTH] Attempting login for:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('❌ [AUTH] Login error:', error);
        return { success: false, error: error.message };
      }

      if (data.user) {
        console.log('✅ [AUTH] Login successful');
        return { success: true };
      }

      return { success: false, error: 'Login failed' };
    } catch (error: any) {
      console.error('❌ [AUTH] Login exception:', error);
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
      console.log('📝 [AUTH] Attempting registration for:', email, 'as', role);
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
        console.error('❌ [AUTH] Registration error:', error);
        setWaitingForProfile(false);
        return { success: false, error: error.message };
      }

      if (data.user) {
        console.log('✅ [AUTH] Registration successful, creating profile...');

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
          console.error('❌ [AUTH] Profile creation error:', profileError);
          setWaitingForProfile(false);
          return { success: false, error: 'Failed to create user profile' };
        }

        console.log('✅ [AUTH] Profile created successfully');

        if (role === 'client') {
          // For clients, wait a moment and then load their data
          setTimeout(async () => {
            await loadUserData(data.user);
            toast({
              title: "Welcome!",
              description: "Your account has been created successfully. Welcome to our platform!",
            });
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
      console.error('❌ [AUTH] Registration exception:', error);
      setWaitingForProfile(false);
      return { success: false, error: error.message || 'Registration failed' };
    }
  };

  const logout = async () => {
    try {
      console.log('🚪 [AUTH] Logging out...');
      await supabase.auth.signOut();
      console.log('✅ [AUTH] Logout successful');
    } catch (error) {
      console.error('❌ [AUTH] Logout error:', error);
      window.location.href = '/';
    }
  };

  useEffect(() => {
    console.log('🔄 [AUTH] Setting up auth state listener...');
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔔 [AUTH] Auth state changed:', event, session?.user?.id || 'no user');
        
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
        console.log('🔍 [AUTH] Checking for existing session...');
        
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ [AUTH] Session error:', error);
          setLoading(false);
          return;
        }
        
        if (session?.user) {
          console.log('✅ [AUTH] Found existing session');
          await loadUserData(session.user);
        } else {
          console.log('ℹ️ [AUTH] No existing session found');
          setLoading(false);
        }
      } catch (error) {
        console.error('❌ [AUTH] Error initializing auth:', error);
        setLoading(false);
      }
    };

    initializeAuth();

    return () => {
      console.log('🧹 [AUTH] Cleaning up auth listener');
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
