import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface LoginFormProps {
  onBack?: () => void;
  onSwitchToRegister?: () => void;
}

export default function LoginForm({ onBack, onSwitchToRegister }: LoginFormProps) {
  const navigate = useNavigate();
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
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      });

      if (loginError) {
        setError("Invalid email or password.");
        setLoading(false);
        return;
      }

      // Get session + user
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData?.session?.user;

      if (!user) {
        setError("Session not found after login.");
        setLoading(false);
        return;
      }

      // Get role
      const { data: roleData, error: roleError } = await supabase.rpc("get_current_user_role");

      if (roleError || !roleData) {
        setError("Could not determine user role.");
        setLoading(false);
        return;
      }

      const role = roleData;

      if (role === "admin") {
        navigate("/AdminDashboard");
      } else if (role === "client") {
        navigate("/ClientDashboard");
      } else if (role === "tasker") {
        const { data: taskerData, error: taskerError } = await supabase
          .from("users")
          .select("approved")
          .eq("id", user.id)
          .single();

        if (taskerError || !taskerData) {
          setError("Could not check tasker approval.");
          setLoading(false);
          return;
        }

        if (taskerData.approved === true) {
          navigate("/TaskerDashboard");
        } else {
          navigate("/TaskerPending");
        }
      } else {
        setError("Unknown user role.");
      }
    } catch (err: any) {
      setError(err.message || "Unexpected error during login.");
    }

    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <div className="flex items-center mb-6">
          {onBack && (
            <Button variant="ghost" onClick={onBack} className="mr-2 p-2">
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

          <Button className="w-full mt-4" type="submit" disabled={loading}>
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
