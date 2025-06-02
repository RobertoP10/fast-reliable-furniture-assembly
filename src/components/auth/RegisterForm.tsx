
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Wrench, ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface RegisterFormProps {
  onBack: () => void;
  onSwitchToLogin: () => void;
}

const RegisterForm = ({ onBack, onSwitchToLogin }: RegisterFormProps) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "" as "client" | "tasker",
    location: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.password || !formData.role || !formData.location) {
      toast({
        title: "Error",
        description: "Please fill in all fields.",
        variant: "destructive",
      });
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords don't match.",
        variant: "destructive",
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      console.log('📝 [REGISTER] Attempting registration with instant access...', {
        email: formData.email,
        role: formData.role,
        timestamp: new Date().toISOString()
      });
      
      await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        location: formData.location
      });
      
      toast({
        title: "Registration successful!",
        description: formData.role === 'tasker' 
          ? "Your tasker account will be reviewed and approved soon. You have instant access!"
          : "Welcome to MGSDEAL! You have instant access!",
      });
      
      console.log('✅ [REGISTER] Registration completed successfully, user should be redirected');
      // Redirect will be handled by the AuthContext
    } catch (error: any) {
      console.error('❌ [REGISTER] Registration failed:', error);
      
      let errorMessage = error.message || "Please try again.";
      
      // Handle specific error cases
      if (error.message.includes('User already registered')) {
        errorMessage = "An account with this email already exists. Please try logging in instead.";
      } else if (error.message.includes('Email not confirmed')) {
        errorMessage = "There was an issue with email verification. Please try again or contact support.";
      }
      
      toast({
        title: "Registration error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <Button
          variant="ghost"
          onClick={onBack}
          className="mb-6 hover:bg-blue-50"
          disabled={isLoading}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <Card className="shadow-xl border-0">
          <CardHeader className="space-y-1 text-center">
            <div className="flex items-center justify-center mb-4">
              <Wrench className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold ml-2 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                MGSDEAL
              </span>
            </div>
            <CardTitle className="text-2xl text-blue-900">Create new account</CardTitle>
            <CardDescription>
              Join the MGSDEAL community - instant access, no email confirmation required!
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Full name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="First Last"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="mt-1"
                  disabled={isLoading}
                />
              </div>
              
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="mt-1"
                  disabled={isLoading}
                />
              </div>

              <div>
                <Label htmlFor="role">Account type</Label>
                <Select 
                  value={formData.role} 
                  onValueChange={(value: "client" | "tasker") => setFormData({ ...formData, role: value })}
                  disabled={isLoading}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="client">Client - Looking for assembly services</SelectItem>
                    <SelectItem value="tasker">Tasker - Offering assembly services</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  type="text"
                  placeholder="Birmingham, UK"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  required
                  className="mt-1"
                  disabled={isLoading}
                />
              </div>
              
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Minimum 6 characters"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  className="mt-1"
                  disabled={isLoading}
                />
              </div>
              
              <div>
                <Label htmlFor="confirmPassword">Confirm password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Repeat your password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  required
                  className="mt-1"
                  disabled={isLoading}
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={isLoading}
              >
                {isLoading ? "Creating account..." : "Create account"}
              </Button>
            </form>
            
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{" "}
                <button
                  onClick={onSwitchToLogin}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                  disabled={isLoading}
                >
                  Login
                </button>
              </p>
            </div>

            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-xs text-green-700">
                <strong>Instant Access:</strong> No email confirmation required - you'll be logged in immediately!
                {formData.role === 'tasker' && " Tasker accounts require admin approval before you can start bidding on tasks."}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RegisterForm;
