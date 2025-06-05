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
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchUserProfile = async (authUser: SupabaseUser): Promise<User | null> => {
    const { data, error } = await supabase
      .from('users')
      .select('id, email, full_name, role, approved, created_at, updated_at')
      .eq('id', authUser.id)
      .single();

    if (error || !data) {
      console.error("❌ Failed to fetch profile", error);
      return null;
    }

    return {
      id: data.id,
      email: data.email,
      full_name: data.full_name,
      role: data.role,
      approved: data.approved,
      created_at: data.created_at,
      updated_at: data.updated_at,
    };
  };

  const handleRedirect = (user: User) => {
    if (user.role === 'admin') {
      navigate('/admin-dashboard');
    } else if (user.role === 'tasker' && user.approved) {
      navigate('/tasker-dashboard');
    } else if (user.role === 'tasker' && !user.approved) {
      navigate('/tasker-pending');
    } else {
      navigate('/client-dashboard');
    }
  };

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setLoading(true);
        const profile = await fetchUserProfile(session.user);
        if (profile) {
          setUser(profile);
          setLoading(false);
          handleRedirect(profile);
        } else {
          await supabase.auth.signOut();
          setUser(null);
          setLoading(false);
        }
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const profile = await fetchUserProfile(session.user);
        if (profile) {
          setUser(profile);
          setLoading(false);
          handleRedirect(profile);
        } else {
          await supabase.auth.signOut();
          setUser(null);
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    });

    return () => {
      listener?.subscription.unsubscribe();
    };
  }, [navigate]);

  const login = async (email: string, password: string) => {
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
    if (!data.session) throw new Error("No session returned");
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    navigate('/');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
