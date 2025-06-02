
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import LoginForm from "@/components/auth/LoginForm";
import RegisterForm from "@/components/auth/RegisterForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Wrench, CheckCircle, Users, Star } from "lucide-react";

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      console.log('User authenticated, redirecting based on role:', user.role, 'approved:', user.approved);
      
      // Role-based routing
      switch (user.role) {
        case 'admin':
          navigate('/admin-dashboard');
          break;
        case 'tasker':
          if (user.approved === true) {
            navigate('/tasker-dashboard');
          } else if (user.approved === null || user.approved === false) {
            navigate('/tasker-pending');
          }
          break;
        case 'client':
        default:
          navigate('/client-dashboard');
          break;
      }
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <Wrench className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If user is authenticated, they should be redirected above
  if (user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-blue-100">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-center">
            <div className="flex items-center space-x-3">
              <Wrench className="h-10 w-10 text-blue-600" />
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                MGSDEAL
              </h1>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left side - Welcome content */}
          <div className="space-y-8">
            <div className="text-center lg:text-left">
              <h2 className="text-4xl lg:text-5xl font-bold text-blue-900 mb-6">
                IKEA Assembly Made Easy
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                Connect with skilled taskers in Birmingham and surrounding areas for professional IKEA furniture assembly.
              </p>
            </div>

            {/* Features */}
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="flex items-start space-x-4">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-blue-900 mb-2">Verified Taskers</h3>
                  <p className="text-gray-600 text-sm">All taskers are background checked and verified for your safety.</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-blue-900 mb-2">Local Experts</h3>
                  <p className="text-gray-600 text-sm">Connect with local professionals in Birmingham area.</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <Star className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-blue-900 mb-2">Quality Service</h3>
                  <p className="text-gray-600 text-sm">Rated taskers with reviews from real customers.</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <Wrench className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-blue-900 mb-2">Fair Pricing</h3>
                  <p className="text-gray-600 text-sm">Transparent pricing with no hidden fees.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right side - Auth forms */}
          <div className="flex justify-center">
            <Card className="w-full max-w-md shadow-xl border-0">
              <CardContent className="p-6">
                <Tabs defaultValue="login" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="login">Sign In</TabsTrigger>
                    <TabsTrigger value="register">Sign Up</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="login" className="space-y-4">
                    <div className="text-center mb-6">
                      <h3 className="text-2xl font-bold text-blue-900">Welcome Back</h3>
                      <p className="text-gray-600">Sign in to your account</p>
                    </div>
                    <LoginForm />
                  </TabsContent>
                  
                  <TabsContent value="register" className="space-y-4">
                    <div className="text-center mb-6">
                      <h3 className="text-2xl font-bold text-blue-900">Join MGSDEAL</h3>
                      <p className="text-gray-600">Create your account today</p>
                    </div>
                    <RegisterForm />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
