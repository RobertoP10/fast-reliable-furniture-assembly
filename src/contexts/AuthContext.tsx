
"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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

  // Check if user exists and refresh user data
  const refreshUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data: profile, error } = await supabase
          .from("users")
          .select("*")
          .eq("id", user.id as any)
          .single();

        if (error) {
          console.error("Error fetching user profile:", error);
          setUserData(null);
        } else {
          setUserData(profile);
        }
      } else {
        setUserData(null);
      }
    } catch (error) {
      console.error("Error refreshing user data:", error);
      setUserData(null);
    }
  };

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          setUser(session.user);
          await refreshUserData();
        }
      } catch (error) {
        console.error("Error getting initial session:", error);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth state changed:", event, session?.user?.id);
        
        if (session?.user) {
          setUser(session.user);
          await refreshUserData();
        } else {
          setUser(null);
          setUserData(null);
        }
        
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        setUser(data.user);
        await refreshUserData();
        
        toast({
          title: "✅ Login successful",
          description: "Welcome back!",
        });
      }

      return { success: true };
    } catch (error: any) {
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
      setWaitingForProfile(true);
      
      // First, sign up the user
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
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
        return { success: false, error: error.message };
      }

      if (data.user) {
        // Create the user profile in our users table
        const approved = role === "client" ? true : false;
        
        const { error: profileError } = await supabase
          .from("users")
          .insert({
            email,
            full_name: fullName,
            phone_number: phoneNumber,
            location: location,
            role: role as any,
            approved: approved,
            terms_accepted: termsAccepted,
            terms_accepted_at: termsAccepted ? new Date().toISOString() : null,
          } as any);

        if (profileError) {
          console.error("Error creating user profile:", profileError);
          return { success: false, error: "Failed to create user profile" };
        }

        toast({
          title: "✅ Registration successful",
          description: "Please check your email to verify your account.",
        });
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    } finally {
      setWaitingForProfile(false);
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setUserData(null);
      
      toast({
        title: "✅ Logged out",
        description: "You have been logged out successfully.",
      });
    } catch (error: any) {
      console.error("Logout error:", error);
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
