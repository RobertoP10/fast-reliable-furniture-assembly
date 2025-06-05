import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

type UserRole = Database['public']['Enums']['user_role'];
type DbUser = Database['public']['Tables']['users']['Row'];

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  approved: boolean;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: Omit<User, 'id' | 'approved' | 'created_at' | 'updated_at'> & { password: string }) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const redirectUser = (profile: User) => {
    if (window.location.pathname !== '/') return;

    switch (profile.role) {
      case 'admin':
        navigate('/admin-dashboard', { replace: true });
        break;
      case 'tasker':
        if (profile.approved) {
          navigate('/tasker-dashboard', { replace: true });
        } else {
          navigate('/tasker-pending', { replace: true });
        }
        break;
      case 'client':
      default:
        navigate('/client-dashboard', { replace: true });
    }
  };

  const fetchUserProfile = async (authUser: SupabaseUser): Promise<User | null> => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, email, full_name, role, approved, created_at, updated_at')
        .eq('id', authUser.id)
        .single();

      if (error || !data) {
        console.error('Error fetching user profile:', error);
        return null;
      }

      return {
        id: data.id,
        email: data.email,
        full_name: data.full_name,
        role: data.role,
        approved: data.approved,
        created_at: data.created_at,
        updated_at: data.updated_at
      };
    } catch (err) {
      console.error('Exception in fetchUserProfile:', err);
      return null;
    }
  };

  useEffect(() => {
    let mounted = true;

    const handleAuthChange = async (event: string, session: any) => {
      if (!mounted) return;

      if (session?.user) {
        const profile = await fetchUserProfile(session.user);
        if (profile && mounted) {
          setUser(profile);
          setLoading(false);
          redirectUser(profile);
        } else {
          await supabase.auth.signOut();
          setUser(null);
          setLoading(false);
        }
      } else {
        setUser(null);
        setLoading(false);
      }
    };

    // Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthChange);

    // Load initial session
    const initSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error || !session?.user) {
        setUser(null);
        setLoading(false);
        return;
      }

      const profile = await fetchUserProfile(session.user);
      if (profile && mounted) {
        setUser(profile);
        setLoading(false);
        redirectUser(profile);
      } else {
        await supabase.auth.signOut();
        setUser(null);
        setLoading(false);
      }
    };

    initSession();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setLoading(false);
      throw new Error(error.message);
    }
    // Redirect will be handled by onAuthStateChange
  };

  const register = async (userData: Omit<User, 'id' | 'approved' | 'created_at' | 'updated_at'> & { password: string }) => {
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: {
        data: {
          name: userData.full_name,
          role: userData.role
        },
        emailRedirectTo: `${window.location.origin}/`
      }
    });

    if (error) {
      setLoading(false);
      throw new Error(error.message);
    }

    setLoading(false);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    navigate('/', { replace: true });
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
