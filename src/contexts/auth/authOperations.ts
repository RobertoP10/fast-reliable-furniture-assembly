
import { supabase } from '@/integrations/supabase/client';
import { fetchUserProfile } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import type { AuthResponse } from './types';

export const createAuthOperations = (
  setWaitingForProfile: (waiting: boolean) => void,
  toast: ReturnType<typeof useToast>['toast']
) => {
  const login = async (email: string, password: string): Promise<AuthResponse> => {
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
  ): Promise<AuthResponse> => {
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
          console.log('🔄 [AUTH_CONTEXT] Auto-signing in client...');
          
          // Sign out first to ensure clean state
          await supabase.auth.signOut();
          
          // Wait a moment for signout to complete
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Then sign in the client
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (signInError) {
            console.error('❌ [AUTH_CONTEXT] Auto sign-in error:', signInError);
            setWaitingForProfile(false);
            toast({
              title: "Registration Successful!",
              description: "Your account has been created. Please log in manually.",
            });
            return { success: true };
          }

          if (signInData.user) {
            console.log('✅ [AUTH_CONTEXT] Client auto sign-in successful');
            toast({
              title: "Welcome!",
              description: "Your account has been created successfully. Welcome to our platform!",
            });
          }
        } else if (role === 'tasker') {
          toast({
            title: "Registration Successful!",
            description: "Your tasker application has been submitted for review. You'll be notified once approved.",
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
      console.log('✅ [AUTH_CONTEXT] Logout successful');
      // Redirect will be handled by the auth state change event
    } catch (error) {
      console.error('❌ [AUTH_CONTEXT] Logout error:', error);
      // Force redirect as fallback
      window.location.href = '/';
    }
  };

  return { login, register, logout };
};
