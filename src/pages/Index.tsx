import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import LoginForm from "@/components/auth/LoginForm";
import RegisterForm from "@/components/auth/RegisterForm";
import {
  Users, Shield, Star, CheckCircle, MessageSquare, Loader2
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const { loading } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600 font-medium">Loading your account...</p>
          <p className="mt-2 text-sm text-gray-500">Please wait while we verify your session</p>
        </div>
      </div>
    );
  }

  if (showLogin) {
    return (
      <LoginForm
        onBack={() => setShowLogin(false)}
        onSwitchToRegister={() => {
          setShowLogin(false);
          setShowRegister(true);
        }}
      />
    );
  }

  if (showRegister) {
    return (
      <RegisterForm
        onBack={() => setShowRegister(false)}
        onSwitchToLogin={() => {
          setShowRegister(false);
          setShowLogin(true);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* HEADER */}
      <header className="bg-white/80 backdrop-blur-md border-b border-blue-100 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <img
              src="/lovable-uploads/50093cff-7c1c-4e83-bc2c-9328a7d7e45c.png"
              alt="MGS Deal Logo"
              className="h-10 w-10 object-contain"
            />
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              MGSDEAL
            </span>
          </div>
          <div className="space-x-3">
            <Button variant="outline" onClick={() => setShowLogin(true)}>Login</Button>
            <Button onClick={() => setShowRegister(true)} className="bg-blue-600 hover:bg-blue-700">Register</Button>
          </div>
        </div>
      </header>

      {/* HERO + FEATURES + CTA + FOOTER rămân neschimbate */}
      {/* ... */}
    </div>
  );
};

export default Index;
