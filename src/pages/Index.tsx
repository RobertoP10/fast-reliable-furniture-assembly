
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
    // Only redirect if we have a user and we're not loading
    if (!loading && user) {
      console.log('User authenticated, redirecting based on role:', user.role);
      console.log('User object:', user);
      
      // Redirect based on user role - no dependency on profile fields
      let redirectPath = '/client'; // Default to client
      
      if (user.role === 'admin') {
        redirectPath = '/admin-dashboard';
      } else if (user.role === 'tasker') {
        redirectPath = '/tasker';
      } else {
        // Default to client for any other role or undefined role
        redirectPath = '/client';
      }
      
      console.log('Redirecting to:', redirectPath);
      
      // Force immediate redirect
      setTimeout(() => {
        navigate(redirectPath, { replace: true });
      }, 100);
    }
  }, [user, loading, navigate]);

  // Show loading state while checking auth
  if (loading) {
    console.log('Auth loading...');
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If we have a user but we're still here, show redirecting message
  if (user) {
    console.log('User exists but still on index page, showing redirect message');
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to dashboard...</p>
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
