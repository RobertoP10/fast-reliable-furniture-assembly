
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import type { User } from './types';
import { fetchUserProfile } from './authService';

export const useAuthState = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const handleUserRedirect = (user: User) => {
    console.log('Redirecting user based on role:', user.role);
    
    // Only redirect if we're currently on the root page or auth pages
    const currentPath = window.location.pathname;
    if (currentPath === '/' || currentPath === '/login' || currentPath === '/register') {
      if (user.role === 'client') {
        navigate('/client-dashboard');
      } else if (user.role === 'tasker') {
        navigate('/tasker-dashboard');
      } else if (user.role === 'admin') {
        navigate('/admin-dashboard');
      }
    }
  };

  useEffect(() => {
    console.log('Setting up auth state listener...');
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session?.user?.id);
        setSession(session);
        
        if (session?.user) {
          try {
            // Fetch user profile from users table
            const userProfile = await fetchUserProfile(session.user.id);
            
            if (userProfile) {
              setUser(userProfile);
              // Handle redirect after successful profile fetch
              setTimeout(() => {
                handleUserRedirect(userProfile);
              }, 100);
            } else {
              console.log('No user profile found, user needs to complete registration');
              setUser(null);
            }
          } catch (error) {
            console.error('Error fetching user profile:', error);
            setUser(null);
          }
        } else {
          setUser(null);
        }
        
        setLoading(false);
      }
    );

    // Check for existing session
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting initial session:', error);
          setLoading(false);
          return;
        }
        
        console.log('Initial session check:', session?.user?.id);
        
        if (session?.user) {
          // The auth state change listener will handle the rest
          console.log('Initial session found, auth listener will handle profile fetch');
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        setLoading(false);
      }
    };

    initializeAuth();

    return () => {
      console.log('Cleaning up auth state listener');
      subscription.unsubscribe();
    };
  }, [navigate]);

  return { user, session, loading, setLoading };
};
