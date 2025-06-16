
"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface AuthContextType {
  user: User | null;
  userData: any;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (
    email: string,
    password: string,
    fullName: string,
    phoneNumber: string,
    location: string,
    role: "client" | "tasker",
    termsAccepted: boolean
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  loading: boolean;
  isAuthenticated: boolean;
  hasAcceptedTerms: boolean;
  waitingForProfile: boolean;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [waitingForProfile, setWaitingForProfile] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Check if user exists and refresh user data
  const refreshUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        console.log('🔄 [AUTH] Fetching user profile for:', user.id);
        const { data: profile, error } = await supabase
          .from("users")
          .select("*")
          .eq("id", user.id)
          .single();

        if (error) {
          console.error("❌ [AUTH] Error fetching user profile:", error);
          setUserData(null);
        } else {
          console.log('✅ [AUTH] User profile loaded:', { role: profile.role, approved: profile.approved });
          setUserData(profile);
        }
      } else {
        setUserData(null);
      }
    } catch (error) {
      console.error("❌ [AUTH] Error refreshing user data:", error);
      setUserData(null);
    }
  };

  useEffect(() => {
    let mounted = true;
    
    // Get initial session
    const getInitialSession = async () => {
      try {
        console.log('🔍 [AUTH] Getting initial session...');
        
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        if (error) {
          console.error('❌ [AUTH] Initial session error:', error);
        } else if (session?.user) {
          console.log('✅ [AUTH] Initial session found for user:', session.user.id);
          setUser(session.user);
          await refreshUserData();
        } else {
          console.log('ℹ️ [AUTH] No initial session');
        }
      } catch (error) {
        console.error('❌ [AUTH] Exception getting initial session:', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        console.log("🔄 [AUTH] Auth state changed:", event, session?.user?.id);
        
        if (session?.user) {
          setUser(session.user);
          // Refresh user data but don't await to prevent blocking
          refreshUserData().catch(console.error);
        } else {
          setUser(null);
          setUserData(null);
        }
        
        setLoading(false);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      console.log('🔑 [AUTH] Attempting login for:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('❌ [AUTH] Login error:', error);
        return { success: false, error: error.message };
      }

      if (data.user) {
        console.log('✅ [AUTH] Login successful for user:', data.user.id);
        setUser(data.user);
        await refreshUserData();
        
        toast({
          title: "✅ Login successful",
          description: "Welcome back!",
        });
      }

      return { success: true };
    } catch (error: any) {
      console.error('❌ [AUTH] Login exception:', error);
      return { success: false, error: error.message };
    }
  };

  const register = async (
    email: string,
    password: string,
    fullName: string,
    phoneNumber: string,
    location: string,
    role: "client" | "tasker",
    termsAccepted: boolean
  ) => {
    try {
      console.log('📝 [AUTH] Starting registration for:', { email, role });
      setWaitingForProfile(true);
      
      // Sign up the user
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: fullName,
            phone_number: phoneNumber,
            location: location,
            role: role,
            terms_accepted: termsAccepted,
            terms_accepted_at: termsAccepted ? new Date().toISOString() : null,
          },
        },
      });

      if (error) {
        console.error('❌ [AUTH] Registration error:', error);
        return { success: false, error: error.message };
      }

      if (data.user) {
        console.log('✅ [AUTH] User signed up, creating profile...');
        
        // Create the user profile in our users table
        const approved = role === "client" ? true : false;
        
        const { error: profileError } = await supabase
          .from("users")
          .insert({
            id: data.user.id,
            email,
            full_name: fullName,
            phone_number: phoneNumber,
            location: location,
            role: role,
            approved: approved,
            terms_accepted: termsAccepted,
            terms_accepted_at: termsAccepted ? new Date().toISOString() : null,
          });

        if (profileError) {
          console.error("❌ [AUTH] Error creating user profile:", profileError);
          return { success: false, error: "Failed to create user profile" };
        }

        console.log('✅ [AUTH] Profile created successfully');

        // Set user and refresh data
        setUser(data.user);
        await refreshUserData();

        // Show success message
        if (role === "client") {
          toast({
            title: "✅ Registration successful",
            description: "Welcome! Redirecting to your dashboard...",
          });
          
          // Redirect client to dashboard
          setTimeout(() => {
            navigate("/client-dashboard");
          }, 1000);
        } else {
          toast({
            title: "✅ Registration successful",
            description: "Your tasker account is pending approval.",
          });
          
          // Redirect tasker to pending page
          setTimeout(() => {
            navigate("/tasker-pending");
          }, 1000);
        }
      }

      return { success: true };
    } catch (error: any) {
      console.error('❌ [AUTH] Registration exception:', error);
      return { success: false, error: error.message };
    } finally {
      setWaitingForProfile(false);
    }
  };

  const logout = async () => {
    try {
      console.log('🚪 [AUTH] Logging out...');
      await supabase.auth.signOut();
      setUser(null);
      setUserData(null);
      
      toast({
        title: "✅ Logged out",
        description: "You have been logged out successfully.",
      });

      // Redirect to home page
      navigate("/");
      
    } catch (error: any) {
      console.error("❌ [AUTH] Logout error:", error);
      toast({
        title: "❌ Logout failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const isAuthenticated = !!user;
  const hasAcceptedTerms = userData?.terms_accepted === true;

  const value: AuthContextType = {
    user,
    userData,
    login,
    register,
    logout,
    loading,
    isAuthenticated,
    hasAcceptedTerms,
    waitingForProfile,
    refreshUserData,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
