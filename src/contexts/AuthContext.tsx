import { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { fetchUserProfile } from "@/lib/auth";
import LoadingScreen from "@/components/LoadingScreen";

interface AuthContextType {
  user: any;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
  waitingForProfile: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [waitingForProfile, setWaitingForProfile] = useState(false);
  const navigate = useNavigate();

  const handleRedirect = (profile: any) => {
    if (profile?.role === 'admin') {
      navigate('/admin-dashboard');
    } else if (profile?.role === 'client') {
      navigate('/client-dashboard');
    } else if (profile?.role === 'tasker') {
      if (profile?.approved) {
        navigate('/tasker-dashboard');
      } else {
        navigate('/tasker-pending');
      }
    } else {
      console.warn("No role found, redirecting to /");
      navigate('/');
    }
  };

  const syncSessionAndProfile = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const profile = await fetchUserProfile(session.user);
      if (profile) {
        setUser(profile);
        handleRedirect(profile);
      } else {
        setUser(null);
        console.error("❌ No user profile found in DB.");
      }
    } else {
      setUser(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    const fetchData = async () => {
      await syncSessionAndProfile();
    };

    fetchData();

    supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth state change:", event);
      if (event === 'INITIAL_SESSION') return;
      if (session?.user) {
        syncSessionAndProfile();
      } else {
        setUser(null);
        setLoading(false);
      }
    });
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw new Error(error.message);
    if (!data.session) throw new Error("No session returned");
    await syncSessionAndProfile();
  };

  const register = async (data: any) => {
    setLoading(true);
    setWaitingForProfile(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
      });
      if (authError) throw new Error(authError.message);
      if (!authData.user) throw new Error("No user returned from signup");

      const { error: insertError } = await supabase.from('users').insert({
        id: authData.user.id,
        email: data.email,
        full_name: data.full_name,
        role: data.role,
        approved: data.role === 'client'
      });

      if (insertError) throw new Error("Failed to insert new user");
      console.log("✅ User registered and inserted, proceeding to login...");
      await login(data.email, data.password);
    } catch (err) {
      console.error("❌ Registration error:", err);
      throw err;
    } finally {
      setLoading(false);
      setWaitingForProfile(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signOut();
    if (error) console.error("❌ Logout error:", error);
    setUser(null);
    navigate('/');
    setLoading(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        logout,
        loading,
        waitingForProfile
      }}
    >
      {loading ? <LoadingScreen /> : children}
    </AuthContext.Provider>
  );
};
