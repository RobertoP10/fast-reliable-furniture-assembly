
import { useState, useEffect } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import type { User } from './types';
import { transformUserProfile } from './userUtils';

export const useAuthState = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const fetchUserProfile = async (userId: string, email: string) => {
      try {
        console.log('Fetching user profile for:', userId);
        const { data: userProfile, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .maybeSingle();
        
        if (error) {
          console.error('Error fetching user profile:', error);
          return null;
        }
        
        if (userProfile) {
          console.log('User profile found:', userProfile);
          return transformUserProfile(userProfile, email);
        } else {
          console.log('No user profile found for:', userId);
          return null;
        }
      } catch (error) {
        console.error('Error in fetchUserProfile:', error);
        return null;
      }
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session?.user?.id);
        
        if (!mounted) return;
        
        setSession(session);
        
        if (session?.user) {
          const userProfile = await fetchUserProfile(session.user.id, session.user.email || '');
          if (mounted) {
            setUser(userProfile);
            setLoading(false);
          }
        } else {
          if (mounted) {
            setUser(null);
            setLoading(false);
          }
        }
      }
    );

    // Check for existing session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting initial session:', error);
          if (mounted) {
            setLoading(false);
          }
          return;
        }
        
        if (session?.user) {
          const userProfile = await fetchUserProfile(session.user.id, session.user.email || '');
          if (mounted) {
            setSession(session);
            setUser(userProfile);
            setLoading(false);
          }
        } else {
          if (mounted) {
            setLoading(false);
          }
        }
      } catch (error) {
        console.error('Error in getInitialSession:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    getInitialSession();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return { user, session, loading, setLoading };
};
