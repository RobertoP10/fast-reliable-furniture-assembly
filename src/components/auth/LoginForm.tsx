"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!form.email || !form.password) {
      setError("Please fill in all fields.");
      return;
    }

    const { error: loginError } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    });

    if (loginError) {
      setError("Invalid email or password.");
      return;
    }

    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData?.session?.user;

    if (!user) {
      setError("Authentication failed.");
      return;
    }

    const { data: roleData, error: roleError } = await supabase.rpc("get_current_user_role");

    if (roleError || !roleData) {
      setError("Could not determine user role.");
      return;
    }

    const role = roleData;

    if (role === "admin") {
      router.push("/AdminDashboard");
    } else if (role === "client") {
      router.push("/ClientDashboard");
    } else if (role === "tasker") {
      const { data: taskerData, error: taskerError } = await supabase
        .from("users")
        .select("approved")
        .eq("id", user.id)
        .single();

      if (taskerError) {
        setError("Failed to verify tasker approval status.");
        return;
      }

      if (taskerData.approved === true) {
        router.push("/TaskerDashboard");
      } else {
        router.push("/TaskerPending");
      }
    } else {
      setError("Unknown role.");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Login</h1>

        <div className="space-y-4">
          <Input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
          <Input
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />

          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

          <Button className="w-full mt-4" type="submit">
            Login
          </Button>
        </div>
      </form>
    </div>
  );
}
