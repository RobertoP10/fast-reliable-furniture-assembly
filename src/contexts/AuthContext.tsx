
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
  const [initialized, setInitialized] = useState(false);
  const [sessionRecoveryAttempted, setSessionRecoveryAttempted] = useState(false);
  const navigate = useNavigate();

  const handleRedirect = (profile: any) => {
    const currentPath = window.location.pathname;
    
    // Don't redirect if user is already on the correct page
    if (profile?.role === "admin" && currentPath === "/admin-dashboard") return;
    if (profile?.role === "client" && currentPath === "/client-dashboard") return;
    if (profile?.role === "tasker" && profile?.approved && currentPath === "/tasker-dashboard") return;
    if (profile?.role === "tasker" && !profile?.approved && currentPath === "/tasker-pending") return;

    // Only redirect if we're on the home page or if this is the initial load
    if (currentPath === '/' || !initialized) {
      console.log('🔄 [AUTH] Redirecting user to dashboard:', { role: profile?.role, approved: profile?.approved });
      
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
    }
  };

  const syncSessionAndProfile = async (retryCount = 0, skipRedirect = false) => {
    try {
      console.log('🔍 [AUTH] Starting session and profile sync...', { retryCount, skipRedirect, sessionRecoveryAttempted });
      
      // Mark that we've attempted session recovery
      if (!sessionRecoveryAttempted) {
        setSessionRecoveryAttempted(true);
      }

      // Add a small delay on retries to prevent rapid successive calls
      if (retryCount > 0) {
        await new Promise(resolve => setTimeout(resolve, Math.min(1000 * retryCount, 2000)));
      }

      // Use a more direct approach for session validation on retries
      let sessionValidation;
      if (retryCount > 0) {
        console.log('🔄 [AUTH] Using direct session check for retry...');
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error || !session?.user?.id) {
          sessionValidation = { isValid: false, userId: null, error: error?.message || 'No session' };
        } else {
          sessionValidation = { isValid: true, userId: session.user.id };
        }
      } else {
        sessionValidation = await validateSession();
      }
      
      if (!sessionValidation.isValid || !sessionValidation.userId) {
        console.log('ℹ️ [AUTH] No valid session found:', sessionValidation.error);
        setUser(null);
        setLoading(false);
        setInitialized(true);
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
          
          // Set user state first
          setUser(profile);
          
          // Only handle redirect if not skipped and this is initial load or we're on home page
          if (!skipRedirect) {
            handleRedirect(profile);
          }
        } else {
          console.error("❌ [AUTH] No user profile found for user:", sessionValidation.userId);
          
          // If we can't find the profile but have a valid session, retry once with direct approach
          if (retryCount < 1) {
            console.log('🔄 [AUTH] Retrying profile fetch due to missing profile...');
            return syncSessionAndProfile(retryCount + 1, skipRedirect);
          }
          
          setUser(null);
        }
      } catch (err: any) {
        console.error("❌ [AUTH] Error fetching profile:", err);
        
        // Be more conservative with retries to prevent loops
        if (retryCount < 1 && (err.message?.includes('Authentication required') || err.message?.includes('timeout'))) {
          console.log('🔄 [AUTH] Retrying profile fetch due to error...');
          return syncSessionAndProfile(retryCount + 1, skipRedirect);
        }
        
        setUser(null);
      }
    } catch (err) {
      console.error("❌ [AUTH] Unexpected error in syncSessionAndProfile:", err);
      setUser(null);
    }

    setLoading(false);
    setInitialized(true);
  };

  useEffect(() => {
    let mounted = true;
    let authSubscription: any = null;

    const initializeAuth = async () => {
      try {
        console.log('🚀 [AUTH] Initializing authentication...');
        
        // Set up auth state listener first
        authSubscription = supabase.auth.onAuthStateChange(
          async (event, session) => {
            console.log("🔁 [AUTH] Auth state change:", event, session ? 'with session' : 'no session');
            
            if (!mounted) return;
            
            if (event === 'SIGNED_OUT') {
              console.log('👋 [AUTH] User signed out');
              setUser(null);
              setLoading(false);
              setInitialized(true);
              setSessionRecoveryAttempted(false);
              return;
            }
            
            // For token refresh, don't redirect to avoid disrupting user experience
            if (session?.user && event === 'TOKEN_REFRESHED') {
              console.log('🔄 [AUTH] Token refreshed, syncing profile without redirect...');
              setLoading(true);
              await syncSessionAndProfile(0, true); // Skip redirect on token refresh
              return;
            }
            
            if (session?.user && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) {
              console.log('👤 [AUTH] User signed in or initial session, syncing...');
              setLoading(true);
              await syncSessionAndProfile(0, event === 'INITIAL_SESSION');
            }
          }
        );

        // Add a smaller delay to ensure auth listener is set up
        await new Promise(resolve => setTimeout(resolve, 50));

        // Try to get existing session with increased timeout for better persistence
        try {
          const sessionPromise = supabase.auth.getSession();
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Initial session check timeout')), 5000); // Increased to 5 seconds
          });

          const { data: { session }, error } = await Promise.race([
            sessionPromise,
            timeoutPromise
          ]) as any;
          
          if (error) {
            console.error('❌ [AUTH] Error getting initial session:', error);
            setLoading(false);
            setInitialized(true);
            return;
          }

          if (session?.user && mounted) {
            console.log('🔍 [AUTH] Found existing session, syncing...');
            await syncSessionAndProfile();
          } else {
            console.log('ℹ️ [AUTH] No existing session found');
            setLoading(false);
            setInitialized(true);
          }
        } catch (sessionError) {
          console.warn('⚠️ [AUTH] Initial session check failed:', sessionError);
          setLoading(false);
          setInitialized(true);
        }

      } catch (error) {
        console.error('❌ [AUTH] Error in initializeAuth:', error);
        if (mounted) {
          setLoading(false);
          setInitialized(true);
        }
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
      if (authSubscription?.data?.subscription) {
        authSubscription.data.subscription.unsubscribe();
      }
    };
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    console.log('🔄 [AUTH] Attempting login for:', email);
    
    try {
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
      // The auth state change listener will handle the sync
    } catch (error) {
      setLoading(false);
      throw error;
    }
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
        phone_number: data.phone_number,
        location: data.location,
        role: data.role,
        approved: data.role === "client",
        terms_accepted: data.terms_accepted,
        terms_accepted_at: data.terms_accepted_at
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
    setInitialized(false);
    setSessionRecoveryAttempted(false);
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
      {loading && !initialized ? <LoadingScreen /> : children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
