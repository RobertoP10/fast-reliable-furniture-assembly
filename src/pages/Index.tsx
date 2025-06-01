
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import LoginForm from "@/components/auth/LoginForm";
import RegisterForm from "@/components/auth/RegisterForm";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/landing/Header";
import HeroSection from "@/components/landing/HeroSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import CTASection from "@/components/landing/CTASection";
import Footer from "@/components/landing/Footer";

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      console.log('User authenticated, redirecting based on role:', user.role);
      
      // Redirect based on user role with correct paths
      switch (user.role) {
        case 'admin':
          navigate('/admin-dashboard', { replace: true });
          break;
        case 'tasker':
          navigate('/tasker-dashboard', { replace: true });
          break;
        case 'client':
          navigate('/client-dashboard', { replace: true });
          break;
        default:
          console.warn('Unknown user role:', user.role);
          navigate('/client-dashboard', { replace: true });
      }
    }
  }, [user, loading, navigate]);

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (showLogin) {
    return <LoginForm onBack={() => setShowLogin(false)} onSwitchToRegister={() => { setShowLogin(false); setShowRegister(true); }} />;
  }

  if (showRegister) {
    return <RegisterForm onBack={() => setShowRegister(false)} onSwitchToLogin={() => { setShowRegister(false); setShowLogin(true); }} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <Header 
        onShowLogin={() => setShowLogin(true)} 
        onShowRegister={() => setShowRegister(true)} 
      />
      <HeroSection onShowRegister={() => setShowRegister(true)} />
      <FeaturesSection />
      <HowItWorksSection />
      <CTASection onShowRegister={() => setShowRegister(true)} />
      <Footer />
    </div>
  );
};

export default Index;
