
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
import { ConversationalFunnel } from "@/components/funnel/ConversationalFunnel";
import { FunnelData } from "@/types/funnel";

const Index = () => {
  const { user, userData, loading } = useAuth();
  const navigate = useNavigate();
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [showFunnel, setShowFunnel] = useState(false);
  const [funnelData, setFunnelData] = useState<FunnelData | null>(null);

  // Redirecționare după ce userul e încărcat complet
  useEffect(() => {
    console.log("🏠 [INDEX] Component mounted - Auth state:", {
      user: user?.id || "none",
      role: userData?.role || "none",
      approved: userData?.approved || false,
      loading,
      currentPath: window.location.pathname,
    });

    if (!loading && user && userData) {
      if (userData.role === "client") {
        navigate("/client-dashboard");
      } else if (userData.role === "tasker" && userData.approved) {
        navigate("/tasker-dashboard");
      } else if (userData.role === "tasker" && !userData.approved) {
        navigate("/tasker-pending");
      } else if (userData.role === "admin") {
        navigate("/admin-dashboard");
      }
    }
  }, [user, userData, loading, navigate]);

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
  if (user && userData && !loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600 font-medium">Redirecting to your dashboard...</p>
          <p className="mt-2 text-xs text-gray-500">
            User: {user.id} | Role: {userData.role} | Approved: {userData.approved.toString()}
          </p>
        </div>
      </div>
    );
  }

  const handleFunnelComplete = (data: FunnelData, onLogin: () => void, onRegister: () => void) => {
    setFunnelData(data);
    setShowFunnel(false);
    // Store funnel data in session storage for after login
    sessionStorage.setItem('funnelData', JSON.stringify(data));
    setShowLogin(true);
  };

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
      
      <HeroSection 
        onShowRegister={() => setShowRegister(true)}
        onStartFunnel={() => setShowFunnel(true)}
      />
      
      <FeaturesSection />
      
      <HowItWorksSection />
      
      <CTASection 
        onShowRegister={() => setShowRegister(true)}
        onStartFunnel={() => setShowFunnel(true)}
      />
      
      <LandingFooter />

      {showFunnel && (
        <ConversationalFunnel
          onClose={() => setShowFunnel(false)}
          onComplete={handleFunnelComplete}
        />
      )}
    </div>
  );
};

export default Index;
