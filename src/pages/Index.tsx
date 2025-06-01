
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import LoginForm from "@/components/auth/LoginForm";
import RegisterForm from "@/components/auth/RegisterForm";
import { useAuth } from "@/contexts/AuthContext";
import { Users, Shield, Star, CheckCircle, MessageSquare } from "lucide-react";

const Index = () => {
  const { user, session, loading } = useAuth();
  const navigate = useNavigate();
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  useEffect(() => {
    if (!loading && session && user) {
      console.log('Redirecting user based on role:', user.role, 'approved:', user.approved);
      
      // Role-based redirection
      if (user.role === 'admin') {
        console.log('Redirecting admin to admin dashboard');
        navigate('/admin-dashboard', { replace: true });
      } else if (user.role === 'tasker') {
        // Check if tasker is approved
        if (user.approved === true) {
          console.log('Redirecting approved tasker to tasker dashboard');
          navigate('/tasker-dashboard', { replace: true });
        } else {
          console.log('Redirecting unapproved tasker to pending page');
          navigate('/tasker-pending', { replace: true });
        }
      } else if (user.role === 'client') {
        console.log('Redirecting client to client dashboard');
        navigate('/client-dashboard', { replace: true });
      } else {
        console.error('Unknown user role:', user.role);
      }
    }
  }, [user, session, loading, navigate]);

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
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

  // Show the landing page for non-authenticated users
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-blue-100 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
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
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
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

      <section className="py-16 px-4 bg-white/50">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">
            Why choose MGSDEAL?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <CardHeader className="text-center">
                <Users className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <CardTitle className="text-blue-900">Verified Taskers</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center text-gray-600">
                  All taskers are manually verified to ensure service quality.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <CardHeader className="text-center">
                <Shield className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <CardTitle className="text-blue-900">Security & Privacy</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center text-gray-600">
                  Personal data is protected. Communication is done through our platform.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <CardHeader className="text-center">
                <Star className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                <CardTitle className="text-blue-900">Review System</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center text-gray-600">
                  Bidirectional reviews to ensure trust between users.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-16 px-4">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">
            How does it work?
          </h2>
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">1</span>
              </div>
              <h3 className="font-semibold mb-2 text-blue-900">Post Task</h3>
              <p className="text-gray-600 text-sm">Describe what you need assembled</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">2</span>
              </div>
              <h3 className="font-semibold mb-2 text-blue-900">Get Offers</h3>
              <p className="text-gray-600 text-sm">Taskers in your area send you offers</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="font-semibold mb-2 text-blue-900">Communicate</h3>
              <p className="text-gray-600 text-sm">Direct chat with chosen tasker</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="font-semibold mb-2 text-blue-900">Complete</h3>
              <p className="text-gray-600 text-sm">Payment and review after completion</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 px-4 bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-6">
            Ready to get started?
          </h2>
          <p className="text-blue-100 mb-8 text-lg">
            Join the MGSDEAL community today
          </p>
          <Button size="lg" variant="secondary" onClick={() => setShowRegister(true)} className="bg-white text-blue-600 hover:bg-gray-100">
            Register Now
          </Button>
        </div>
      </section>

      <footer className="bg-gray-900 text-white py-8 px-4">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <img 
              src="/lovable-uploads/50093cff-7c1c-4e83-bc2c-9328a7d7e45c.png" 
              alt="MGS Deal Logo" 
              className="h-6 w-6 object-contain"
            />
            <span className="text-xl font-bold">MGSDEAL</span>
          </div>
          <p className="text-gray-400">
            © 2025 MGSDEAL. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
