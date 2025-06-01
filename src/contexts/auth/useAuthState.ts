
import { useState, useEffect, useRef } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import type { User } from './types';
import { transformUserProfile } from './userUtils';

export const useAuthState = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;

    const fetchUserProfile = async (userId: string, email: string, retries = 10): Promise<User | null> => {
      for (let attempt = 1; attempt <= retries; attempt++) {
        if (!mounted.current) return null;
        
        try {
          console.log(`Fetching user profile for: ${userId} (attempt ${attempt}/${retries})`);
          
          const { data: userProfile, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .maybeSingle();
          
          if (error) {
            console.error('Error fetching user profile:', error);
            if (attempt === retries) {
              throw new Error(`Failed to fetch user profile: ${error.message}`);
            }
            // Wait before retrying (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, Math.min(Math.pow(2, attempt) * 1000, 5000)));
            continue;
          }
          
          if (userProfile) {
            console.log('User profile found:', userProfile);
            return transformUserProfile(userProfile, email);
          } else {
            console.log(`No user profile found for: ${userId} (attempt ${attempt}/${retries})`);
            if (attempt < retries) {
              // Wait before retrying - the trigger might still be processing
              await new Promise(resolve => setTimeout(resolve, 2000));
              continue;
            } else {
              console.error('User profile not found after all retries');
              return null;
            }
          }
        } catch (error) {
          console.error(`Error in fetchUserProfile attempt ${attempt}:`, error);
          if (attempt === retries) {
            throw error;
          }
          await new Promise(resolve => setTimeout(resolve, Math.min(Math.pow(2, attempt) * 1000, 5000)));
        }
      }
      return null;
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change event:', event, 'Session user ID:', session?.user?.id);
        
        if (!mounted.current) return;
        
        // Always update session state immediately
        setSession(session);
        
        if (session?.user) {
          console.log('User session detected, fetching profile...');
          try {
            const userProfile = await fetchUserProfile(session.user.id, session.user.email || '');
            if (mounted.current) {
              if (userProfile) {
                console.log('Setting user profile:', userProfile);
                setUser(userProfile);
              } else {
                console.error('Failed to load user profile - profile not found');
                setUser(null);
              }
              setLoading(false);
            }
          } catch (error) {
            console.error('Error loading user profile:', error);
            if (mounted.current) {
              setUser(null);
              setLoading(false);
            }
          }
        } else {
          console.log('No user session, clearing user state');
          if (mounted.current) {
            setUser(null);
            setLoading(false);
          }
        }
      }
    );

    // Check for existing session only once
    const getInitialSession = async () => {
      try {
        console.log('Checking for existing session...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting initial session:', error);
          if (mounted.current) {
            setLoading(false);
          }
          return;
        }
        
        if (session?.user) {
          console.log('Found existing session for user:', session.user.id);
          try {
            const userProfile = await fetchUserProfile(session.user.id, session.user.email || '');
            if (mounted.current) {
              setSession(session);
              if (userProfile) {
                setUser(userProfile);
              } else {
                console.error('Failed to load user profile for existing session');
                setUser(null);
              }
              setLoading(false);
            }
          } catch (error) {
            console.error('Error loading profile for existing session:', error);
            if (mounted.current) {
              setSession(session);
              setUser(null);
              setLoading(false);
            }
          }
        } else {
          console.log('No existing session found');
          if (mounted.current) {
            setLoading(false);
          }
        }
      } catch (error) {
        console.error('Error in getInitialSession:', error);
        if (mounted.current) {
          setLoading(false);
        }
      }
    };

    getInitialSession();

    return () => {
      mounted.current = false;
      subscription.unsubscribe();
    };
  }, []);

  return { user, session, loading, setLoading };
};
