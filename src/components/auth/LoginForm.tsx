
"use client";

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
      // Login
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      });

      if (loginError) {
        setError(loginError.message || "Invalid credentials.");
        setLoading(false);
        return;
      }

      // Obține userul curent
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setError("User not found.");
        setLoading(false);
        return;
      }

      // Obține rolul din tabela users
      const { data: userData, error: userFetchError } = await supabase
        .from("users")
        .select("role, approved")
        .eq("id", user.id)
        .single();

      if (userFetchError || !userData) {
        setError("Failed to fetch user role.");
        setLoading(false);
        return;
      }

      // Redirecționare în funcție de rol
      const { role, approved } = userData;

      if (role === "client") {
        navigate("/client-dashboard");
      } else if (role === "tasker") {
        if (approved) {
          navigate("/tasker-dashboard");
        } else {
          navigate("/tasker-pending");
        }
      } else if (role === "admin") {
        navigate("/admin-dashboard");
      } else {
        setError("Unknown user role.");
      }
    } catch (err: any) {
      console.error("Login error:", err);
      setError("Login failed.");
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
