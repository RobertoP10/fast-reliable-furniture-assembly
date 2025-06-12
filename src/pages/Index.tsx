import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import LoginForm from "@/components/auth/LoginForm";
import RegisterForm from "@/components/auth/RegisterForm";
import { useAuth } from "@/contexts/AuthContext";
import {
  Users, Shield, Star, CheckCircle, MessageSquare, Loader2
} from "lucide-react";
import { Footer } from "@/components/Footer";

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
      {/* Header */}
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
            <Button variant="outline" onClick={() => setShowLogin(true)} className="hover:bg-blue-50">
              Login
            </Button>
            <Button onClick={() => setShowRegister(true)} className="bg-blue-600 hover:bg-blue-700">
              Register
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-20 px-4 text-center">
        <div className="container mx-auto">
          <Badge className="mb-6 bg-blue-100 text-blue-700 hover:bg-blue-200">
            Marketplace for Assembly Services
          </Badge>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
            IKEA & Furniture Assembly
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Connecting customers with furniture assembly experts. Simple, fast and professional.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={() => setShowRegister(true)} className="bg-blue-600 hover:bg-blue-700">
              Post a Task
            </Button>
            <Button size="lg" variant="outline" onClick={() => setShowRegister(true)} className="hover:bg-blue-50">
              Become a Tasker
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4 bg-white/50">
        <div className="container mx-auto grid md:grid-cols-3 gap-8">
          {[
            { Icon: Users, title: "Verified Taskers", desc: "All taskers are manually verified to ensure service quality." },
            { Icon: Shield, title: "Security & Privacy", desc: "Personal data is protected. Communication is done through our platform." },
            { Icon: Star, title: "Review System", desc: "Bidirectional reviews to ensure trust between users." },
          ].map(({ Icon, title, desc }, i) => (
            <Card key={i} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <CardHeader className="text-center">
                <Icon className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <CardTitle className="text-blue-900">{title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center text-gray-600">{desc}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 px-4">
        <div className="container mx-auto grid md:grid-cols-4 gap-8 text-center">
          {[
            { step: "1", title: "Post Task", desc: "Describe what you need assembled" },
            { step: "2", title: "Get Offers", desc: "Taskers in your area send you offers" },
            { step: <MessageSquare className="h-8 w-8 text-blue-600" />, title: "Communicate", desc: "Direct chat with chosen tasker" },
            { step: <CheckCircle className="h-8 w-8 text-green-600" />, title: "Complete", desc: "Payment and review after completion" },
          ].map(({ step, title, desc }, i) => (
            <div key={i}>
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">{step}</span>
              </div>
              <h3 className="font-semibold mb-2 text-blue-900">{title}</h3>
              <p className="text-gray-600 text-sm">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-center text-white">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold mb-6">Ready to get started?</h2>
          <p className="mb-8 text-lg">Join the MGSDEAL community today</p>
          <Button size="lg" variant="secondary" onClick={() => setShowRegister(true)} className="bg-white text-blue-600 hover:bg-gray-100">
            Register Now
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 px-4 text-center">
        <div className="container mx-auto">
          <div className="flex justify-center items-center space-x-3 mb-4">
            <img
              src="/lovable-uploads/50093cff-7c1c-4e83-bc2c-9328a7d7e45c.png"
              alt="MGS Deal Logo"
              className="h-6 w-6 object-contain"
            />
            <span className="text-xl font-bold">MGSDEAL</span>
          </div>
          <div className="flex justify-center space-x-6 mb-4">
            <button
              onClick={() => navigate("/terms-of-service")}
              className="text-gray-400 hover:text-white transition-colors"
            >
              Terms of Service
            </button>
            <button
              onClick={() => navigate("/privacy-policy")}
              className="text-gray-400 hover:text-white transition-colors"
            >
              Privacy Policy
            </button>
            <button
              onClick={() => navigate("/contact")}
              className="text-gray-400 hover:text-white transition-colors"
            >
              Contact
            </button>
          </div>
          <p className="text-gray-400">© 2025 MGSDEAL. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
