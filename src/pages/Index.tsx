
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import LoginForm from "@/components/auth/LoginForm";
import RegisterForm from "@/components/auth/RegisterForm";
import { useAuth } from "@/contexts/AuthContext";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { HeroSection } from "@/components/landing/HeroSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { CTASection } from "@/components/landing/CTASection";
import { LandingFooter } from "@/components/landing/LandingFooter";

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  // Redirecționare după ce userul e încărcat complet
  useEffect(() => {
    console.log("🏠 [INDEX] Component mounted - Auth state:", {
      user: user?.id || "none",
      role: user?.role || "none",
      approved: user?.approved || false,
      loading,
      currentPath: window.location.pathname,
    });

    if (!loading && user) {
      if (user.role === "client") {
        navigate("/client-dashboard");
      } else if (user.role === "tasker" && user.approved) {
        navigate("/tasker-dashboard");
      } else if (user.role === "tasker" && !user.approved) {
        navigate("/tasker-pending");
      } else if (user.role === "admin") {
        navigate("/admin-dashboard");
      }
    }
  }, [user, loading, navigate]);

  // Loader când verificăm userul
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600 font-medium">Loading your account...</p>
          <p className="mt-2 text-sm text-gray-500">Please wait while we verify your session</p>
        </div>
      </div>
    );
  }

  // Interfață de redirect în timp ce navighează
  if (user && !loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600 font-medium">Redirecting to your dashboard...</p>
          <p className="mt-2 text-xs text-gray-500">
            User: {user.id} | Role: {user.role} | Approved: {user.approved.toString()}
          </p>
        </div>
      </div>
    );
  }

  // Formulare Login / Register
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
      <LandingHeader 
        onShowLogin={() => setShowLogin(true)} 
        onShowRegister={() => setShowRegister(true)} 
      />
      
      <HeroSection onShowRegister={() => setShowRegister(true)} />
      
      <FeaturesSection />
      
      <HowItWorksSection />
      
      <CTASection onShowRegister={() => setShowRegister(true)} />
      
      <LandingFooter />
    </div>
  );
};

export default Index;
