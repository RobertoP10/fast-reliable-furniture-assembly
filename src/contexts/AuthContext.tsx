
import { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { fetchUserProfile } from "@/lib/auth";
import { validateSession } from "@/lib/session-validator";
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
    if (profile?.role === "admin") {
      navigate("/admin-dashboard");
    } else if (profile?.role === "client") {
      navigate("/client-dashboard");
    } else if (profile?.role === "tasker") {
      if (profile?.approved) {
        navigate("/tasker-dashboard");
      } else {
        navigate("/tasker-pending");
      }
    } else {
      console.warn("⚠️ No role found, redirecting to home.");
      navigate("/");
    }
  };

  const syncSessionAndProfile = async () => {
    try {
      console.log('🔍 [AUTH] Starting session and profile sync...');
      
      // Use the new session validator
      const sessionValidation = await validateSession();
      
      if (!sessionValidation.isValid || !sessionValidation.userId) {
        console.log('ℹ️ [AUTH] No valid session found');
        setUser(null);
        setLoading(false);
        return;
      }

      console.log('✅ [AUTH] Valid session found for user:', sessionValidation.userId);

      try {
        const profile = await fetchUserProfile({ id: sessionValidation.userId });
        if (profile) {
          console.log('✅ [AUTH] Profile fetched successfully:', {
            userId: profile.id,
            role: profile.role,
            approved: profile.approved,
            email: profile.email
          });
          setUser(profile);
          handleRedirect(profile);
        } else {
          console.error("❌ [AUTH] No user profile found.");
          setUser(null);
        }
      } catch (err: any) {
        console.error("❌ [AUTH] Error fetching profile:", err);
        setUser(null);
      }
    } catch (err) {
      console.error("❌ [AUTH] Unexpected error in syncSessionAndProfile:", err);
      setUser(null);
    }

    setLoading(false);
  };

  useEffect(() => {
    const initialize = async () => {
      await syncSessionAndProfile();
    };
    initialize();

    const { data: subscription } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("🔁 [AUTH] Auth state change:", event);
        if (session?.user) {
          await syncSessionAndProfile();
        } else {
          setUser(null);
          setLoading(false);
        }
      }
    );

    return () => {
      subscription?.subscription?.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    console.log('🔄 [AUTH] Attempting login for:', email);
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setLoading(false);
      console.error("❌ [AUTH] Login error:", error);
      throw new Error(error.message);
    }

    if (!data.session) {
      setLoading(false);
      throw new Error("No session returned.");
    }

    console.log("✅ [AUTH] Login successful, syncing profile...");
    await syncSessionAndProfile();
  };

  const register = async (data: any) => {
    setLoading(true);
    setWaitingForProfile(true);

    try {
      console.log('🔄 [AUTH] Attempting registration for:', data.email);
      
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
      });

      if (authError) throw new Error(authError.message);
      if (!authData.user) throw new Error("No user returned from signup");

      console.log('✅ [AUTH] User registered, creating profile...');

      const { error: insertError } = await supabase.from("users").insert({
        id: authData.user.id,
        email: data.email,
        full_name: data.full_name,
        role: data.role,
        approved: data.role === "client",
      });

      if (insertError) throw new Error("Failed to insert user profile");

      console.log("✅ [AUTH] User registered successfully, attempting login...");
      await login(data.email, data.password);
    } catch (err) {
      console.error("❌ [AUTH] Registration error:", err);
      throw err;
    } finally {
      setLoading(false);
      setWaitingForProfile(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    console.log('🔄 [AUTH] Logging out...');
    
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("❌ [AUTH] Logout error:", error);
    } else {
      console.log("✅ [AUTH] Logout successful");
    }
    setUser(null);
    navigate("/");
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
        waitingForProfile,
      }}
    >
      {loading ? <LoadingScreen /> : children}
    </AuthContext.Provider>
  );
};
