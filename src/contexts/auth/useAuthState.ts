
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

    const createUserProfile = async (userId: string, email: string): Promise<boolean> => {
      try {
        console.log('Creating user profile for:', userId);
        
        const { error } = await supabase
          .from('users')
          .insert({
            id: userId,
            email: email,
            name: '',
            role: 'client', // Default to client role
            phone: '',
            location: '',
            approved: 'true', // Auto-approve clients
            created_at: new Date().toISOString()
          });
        
        if (error) {
          console.error('Error creating user profile:', error);
          return false;
        }
        
        console.log('User profile created successfully');
        return true;
      } catch (error) {
        console.error('Error in createUserProfile:', error);
        return false;
      }
    };

    const fetchUserProfile = async (userId: string, email: string): Promise<User | null> => {
      try {
        console.log(`Fetching user profile for: ${userId}`);
        
        const { data: userProfile, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .single();
        
        if (error) {
          console.error('Error fetching user profile:', error);
          if (error.code === 'PGRST116') {
            // Profile not found, create one
            console.log('Profile not found, creating new profile...');
            const created = await createUserProfile(userId, email);
            
            if (created) {
              // Fetch the newly created profile
              const { data: newProfile, error: fetchError } = await supabase
                .from('users')
                .select('*')
                .eq('id', userId)
                .single();
              
              if (fetchError) {
                console.error('Error fetching newly created profile:', fetchError);
                return null;
              }
              
              if (newProfile) {
                console.log('Newly created profile found:', newProfile);
                return transformUserProfile(newProfile, email);
              }
            }
            return null;
          } else {
            console.error('RLS or other error fetching profile:', error);
            return null;
          }
        }
        
        if (userProfile) {
          console.log('User profile found:', userProfile);
          return transformUserProfile(userProfile, email);
        }
        
        console.log('No profile data returned');
        return null;
      } catch (error) {
        console.error('Exception in fetchUserProfile:', error);
        return null;
      }
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change event:', event, 'Session:', !!session);
        
        if (!mounted) return;
        
        setSession(session);
        
        if (session?.user) {
          console.log('User session detected, fetching/creating profile...');
          setLoading(true); // Ensure loading state while fetching profile
          
          const userProfile = await fetchUserProfile(session.user.id, session.user.email || '');
          
          if (mounted) {
            if (userProfile) {
              console.log('Setting user profile:', userProfile);
              setUser(userProfile);
            } else {
              console.error('Failed to fetch or create user profile');
              setUser(null);
            }
            setLoading(false);
          }
        } else {
          console.log('No user session, clearing user state');
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
        console.log('Checking for existing session...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting initial session:', error);
          if (mounted) setLoading(false);
          return;
        }
        
        if (session?.user && mounted) {
          console.log('Found existing session for user:', session.user.id);
          setSession(session);
          
          const userProfile = await fetchUserProfile(session.user.id, session.user.email || '');
          if (mounted) {
            if (userProfile) {
              console.log('Setting initial user profile:', userProfile);
              setUser(userProfile);
            } else {
              console.error('Failed to fetch initial user profile');
              setUser(null);
            }
            setLoading(false);
          }
        } else {
          console.log('No existing session found');
          if (mounted) setLoading(false);
        }
      } catch (error) {
        console.error('Error in getInitialSession:', error);
        if (mounted) setLoading(false);
      }
    };

    getInitialSession();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const setLoadingState = (loadingState: boolean) => {
    setLoading(loadingState);
  };

  return { user, session, loading, setLoading: setLoadingState };
};
