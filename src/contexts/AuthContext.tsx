import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

type UserRole = Database['public']['Enums']['user_role'];

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  approved: boolean;
  created_at: string;
  updated_at: string;
}

interface RegisterData {
  full_name: string;
  email: string;
  password: string;
  location: string;
  role: UserRole;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
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
      .maybeSingle();

    if (error) {
      console.error("❌ Failed to fetch profile", error);
      return null;
    }

    return data || null;
  };

  const waitForUserProfile = async (authUser: SupabaseUser, retries = 20, delay = 300): Promise<User | null> => {
  for (let i = 0; i < retries; i++) {
    const profile = await fetchUserProfile(authUser);
    if (profile) {
      console.log("✅ Profile found after retry", i + 1);
      return profile;
    }
    console.log(`⏳ Retry ${i + 1}/${retries} waiting for profile...`);
    await new Promise(res => setTimeout(res, delay));
  }
  return null;
};

  const handleRedirect = (user: User) => {
    if (user.role === 'admin') {
      navigate('/admin-dashboard');
    } else if (user.role === 'tasker' && user.approved) {
      navigate('/tasker-dashboard');
    } else if (user.role === 'tasker') {
      navigate('/tasker-pending');
    } else {
      navigate('/client-dashboard');
    }
  };

 useEffect(() => {
  const { data: listener } = supabase.auth.onAuthStateChange(async (_, session) => {
    if (session?.user) {
      setLoading(true);
      const profile = await waitForUserProfile(session.user);
      if (profile) {
        setUser(profile);
        handleRedirect(profile);
      } else {
        console.error("❌ Profile not found even after retries");
        setUser(null);
        // Poți naviga la o pagină de eroare sau rămâi pe pagină
        // navigate('/error'); sau afisezi mesaj vizual
      }
      setLoading(false);
    } else {
      setUser(null);
      setLoading(false);
    }
  });

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const profile = await waitForUserProfile(session.user);
        if (profile) {
          setUser(profile);
          handleRedirect(profile);
        }
      }
      setLoading(false);
    });

    return () => {
      listener?.subscription.unsubscribe();
    };
  }, [navigate]);

  const login = async (email: string, password: string) => {
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) throw new Error(error.message);
    if (!data.session) throw new Error("No session returned");
  };

  const register = async (data: RegisterData) => {
    setLoading(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (authError) {
        throw new Error(authError.message);
      }

      if (!authData.user) {
        throw new Error("No user returned from signup");
      }

      const { error: insertError } = await supabase.from('users').insert({
        id: authData.user.id,
        email: data.email,
        full_name: data.full_name,
        role: data.role,
        approved: data.role === 'client',
      });

      if (insertError) {
        throw new Error("Failed to insert into users");
      }

      console.log("✅ User inserted in `users` table.");
    } catch (err) {
      console.error("❌ Registration error:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    navigate('/');
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
