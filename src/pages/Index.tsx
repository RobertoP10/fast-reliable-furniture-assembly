
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import LoginForm from "@/components/auth/LoginForm";
import RegisterForm from "@/components/auth/RegisterForm";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { Wrench, Users, Shield, Star, CheckCircle, MessageSquare } from "lucide-react";

const LandingPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  useEffect(() => {
    if (user) {
      // Redirect based on user role
      if (user.role === 'admin') {
        navigate('/admin-dashboard');
      } else if (user.role === 'tasker') {
        navigate('/tasker-dashboard');
      } else {
        navigate('/client-dashboard');
      }
    }
  }, [user, navigate]);

  if (showLogin) {
    return <LoginForm onBack={() => setShowLogin(false)} onSwitchToRegister={() => { setShowLogin(false); setShowRegister(true); }} />;
  }

  if (showRegister) {
    return <RegisterForm onBack={() => setShowRegister(false)} onSwitchToLogin={() => { setShowRegister(false); setShowLogin(true); }} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-blue-100 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Wrench className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                MGSDEAL
              </span>
            </div>
            <div className="space-x-3">
              <Button variant="outline" onClick={() => setShowLogin(true)} className="hover:bg-blue-50">
                Login
              </Button>
              <Button onClick={() => setShowRegister(true)} className="bg-blue-600 hover:bg-blue-700">
                Înregistrare
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <Badge className="mb-6 bg-blue-100 text-blue-700 hover:bg-blue-200">
            Marketplace pentru servicii de asamblare
          </Badge>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
            Asamblare IKEA & Mobilier
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Conectăm clienții cu experți în asamblare de mobilier. Simplu, rapid și profesional.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={() => setShowRegister(true)} className="bg-blue-600 hover:bg-blue-700">
              Postează un Task
            </Button>
            <Button size="lg" variant="outline" onClick={() => setShowRegister(true)} className="hover:bg-blue-50">
              Devino Tasker
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-white/50">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">
            De ce să alegi MGSDEAL?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <CardHeader className="text-center">
                <Users className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <CardTitle className="text-blue-900">Taskeri Verificați</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center text-gray-600">
                  Toți taskerii sunt validați manual pentru a asigura calitatea serviciilor.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <CardHeader className="text-center">
                <Shield className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <CardTitle className="text-blue-900">Siguranță & Confidențialitate</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center text-gray-600">
                  Datele personale sunt protejate. Comunicarea se face prin platforma noastră.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <CardHeader className="text-center">
                <Star className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                <CardTitle className="text-blue-900">Sistem de Review</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center text-gray-600">
                  Reviewuri bidirecționale pentru a asigura încrederea între utilizatori.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">
            Cum funcționează?
          </h2>
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">1</span>
              </div>
              <h3 className="font-semibold mb-2 text-blue-900">Postează Task</h3>
              <p className="text-gray-600 text-sm">Descrie ce ai nevoie să asamblezi</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">2</span>
              </div>
              <h3 className="font-semibold mb-2 text-blue-900">Primești Oferte</h3>
              <p className="text-gray-600 text-sm">Taskerii din zona ta îți trimit oferte</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="font-semibold mb-2 text-blue-900">Comunici</h3>
              <p className="text-gray-600 text-sm">Chat direct cu taskerul ales</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="font-semibold mb-2 text-blue-900">Finalizare</h3>
              <p className="text-gray-600 text-sm">Plata și review după finalizare</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-6">
            Gata să începi?
          </h2>
          <p className="text-blue-100 mb-8 text-lg">
            Alătură-te comunității MGSDEAL astăzi
          </p>
          <Button size="lg" variant="secondary" onClick={() => setShowRegister(true)} className="bg-white text-blue-600 hover:bg-gray-100">
            Înregistrează-te Acum
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 px-4">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Wrench className="h-6 w-6" />
            <span className="text-xl font-bold">MGSDEAL</span>
          </div>
          <p className="text-gray-400">
            © 2025 MGSDEAL. Toate drepturile rezervate.
          </p>
        </div>
      </footer>
    </div>
  );
};

const Index = () => {
  return (
    <AuthProvider>
      <LandingPage />
    </AuthProvider>
  );
};

export default Index;
