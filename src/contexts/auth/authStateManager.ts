
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { fetchUserProfile } from '@/lib/auth';
import type { UserData } from './types';

export const createAuthStateManager = (
  setUser: (user: User | null) => void,
  setUserData: (userData: UserData | null) => void,
  setLoading: (loading: boolean) => void
) => {
  const loadUserData = async (currentUser: User | null) => {
    console.log('🔄 [AUTH_CONTEXT] Loading user data for:', currentUser?.id || 'no user');
    
    if (!currentUser) {
      setUser(null);
      setUserData(null);
      setLoading(false);
      return;
    }

    try {
      // Add a small delay to allow session to stabilize
      await new Promise(resolve => setTimeout(resolve, 100));
      
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

  const setupAuthListener = () => {
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
          // Redirect to home page
          window.location.href = '/';
        }
      }
    );

    return subscription;
  };

  const initializeAuth = async () => {
    try {
      console.log('🔍 [AUTH_CONTEXT] Checking for existing session...');
      
      // Use a simpler approach - just get the session without complex validation
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

  return { setupAuthListener, initializeAuth };
};
