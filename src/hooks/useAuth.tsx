
import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: 'client' | 'tasker' | 'admin';
  location?: string;
  phone?: string;
  profile_photo?: string;
  approved?: boolean;
}

export const useAuth = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      
      if (session?.user) {
        await fetchUserProfile(session.user.id);
      }
      setLoading(false);
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session);
        setSession(session);
        
        if (session?.user) {
          await fetchUserProfile(session.user.id);
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching user profile:', error);
        return;
      }

      if (data) {
        // Handle approved field conversion properly
        let approvedStatus = false;
        if (typeof data.approved === 'string') {
          approvedStatus = data.approved === 'true';
        } else if (typeof data.approved === 'boolean') {
          approvedStatus = data.approved;
        } else {
          // If approved is null or undefined, handle based on role
          approvedStatus = data.role !== 'tasker';
        }

        setUser({
          id: data.id,
          email: data.email,
          name: data.name,
          role: data.role as 'client' | 'tasker' | 'admin',
          location: data.location,
          phone: data.phone,
          profile_photo: data.profile_photo,
          approved: approvedStatus
        });
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const login = async (email: string, password: string) => {
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    // Don't set loading to false here - let the auth state change handle it
    return { data, error };
  };

  const register = async (email: string, password: string, name: string, role: string, location?: string) => {
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          role,
          location
        }
      }
    });
    
    // Don't set loading to false here - let the auth state change handle it
    return { data, error };
  };

  const logout = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setLoading(false);
    return { error };
  };

  const getDashboardRoute = (userRole: string, approved?: boolean) => {
    if (userRole === 'admin') return '/admin-dashboard';
    if (userRole === 'tasker') {
      return approved ? '/tasker-dashboard' : '/tasker-pending';
    }
    return '/client-dashboard';
  };

  return {
    user,
    session,
    loading,
    login,
    register,
    logout,
    getDashboardRoute,
    fetchUserProfile
  };
};
