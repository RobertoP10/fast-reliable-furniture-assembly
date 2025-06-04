
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

interface LoginFormProps {
  onBack?: () => void;
  onSwitchToRegister?: () => void;
}

export default function LoginForm({ onBack, onSwitchToRegister }: LoginFormProps) {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!form.email || !form.password) {
      setError("Please fill in all fields.");
      setLoading(false);
      return;
    }

    try {
      await login(form.email, form.password);
      // AuthContext will handle the redirect
    } catch (loginError: any) {
      setError(loginError.message || "Invalid email or password.");
    }
    
    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <div className="flex items-center mb-6">
          {onBack && (
            <Button 
              variant="ghost" 
              onClick={onBack}
              className="mr-2 p-2"
            >
              ←
            </Button>
          )}
          <h1 className="text-2xl font-bold text-center flex-1">Login</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
            disabled={loading}
          />
          <Input
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
            disabled={loading}
          />

          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

          <Button 
            className="w-full mt-4" 
            type="submit" 
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </Button>
        </form>

        {onSwitchToRegister && (
          <div className="mt-4 text-center">
            <p className="text-gray-600">
              Don't have an account?{" "}
              <button
                onClick={onSwitchToRegister}
                className="text-blue-600 hover:underline font-medium"
              >
                Register here
              </button>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
