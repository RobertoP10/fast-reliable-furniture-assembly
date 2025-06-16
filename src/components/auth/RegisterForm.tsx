import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { validatePhoneNumber } from "@/utils/phoneValidation";
import TermsAcceptance from "./TermsAcceptance";
import RoleSelection from "./RoleSelection";

interface RegisterFormProps {
  onBack?: () => void;
  onSwitchToLogin?: () => void;
}

export default function RegisterForm({ onBack, onSwitchToLogin }: RegisterFormProps) {
  const { register } = useAuth();
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    location: "",
    phone_number: "",
    role: "client" as "client" | "tasker",
    terms_accepted: false
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!form.full_name || !form.email || !form.password || !form.location || !form.phone_number) {
      setError("Please fill in all fields.");
      setLoading(false);
      return;
    }

    if (form.password.length < 6) {
      setError("Password must be at least 6 characters long.");
      setLoading(false);
      return;
    }

    if (!form.terms_accepted) {
      setError("You must agree to the Terms of Service and Privacy Policy to create an account.");
      setLoading(false);
      return;
    }

    if (!validatePhoneNumber(form.phone_number)) {
      setError("Please enter a valid phone number (e.g., 07440669983, +447440669983, or international format).");
      setLoading(false);
      return;
    }

    try {
      const result = await register(
        form.email,
        form.password,
        form.full_name,
        form.phone_number,
        form.location,
        form.role,
        form.terms_accepted
      );
      
      if (!result.success) {
        setError(result.error || "Registration failed. Please try again.");
      }
      // AuthContext will handle the redirect on success
    } catch (registerError: any) {
      setError(registerError.message || "Registration failed. Please try again.");
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
          <h1 className="text-2xl font-bold text-center flex-1">Register</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="text"
            placeholder="Full Name"
            value={form.full_name}
            onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            required
            disabled={loading}
          />
          
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
            placeholder="Password (min 6 characters)"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
            disabled={loading}
          />

          <Input
            type="tel"
            placeholder="Phone Number (e.g., 07440669983 or +447440669983)"
            value={form.phone_number}
            onChange={(e) => setForm({ ...form, phone_number: e.target.value })}
            required
            disabled={loading}
          />
          
          <Input
            type="text"
            placeholder="Location (City, Country)"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            required
            disabled={loading}
          />

          <RoleSelection
            value={form.role}
            onChange={(value) => setForm({ ...form, role: value })}
            disabled={loading}
          />

          <TermsAcceptance
            checked={form.terms_accepted}
            onChange={(checked) => setForm({ ...form, terms_accepted: checked })}
            disabled={loading}
          />

          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

          <Button 
            className="w-full mt-4" 
            type="submit" 
            disabled={loading}
          >
            {loading ? "Creating Account..." : "Create Account"}
          </Button>
        </form>

        {onSwitchToLogin && (
          <div className="mt-4 text-center">
            <p className="text-gray-600">
              Already have an account?{" "}
              <button
                onClick={onSwitchToLogin}
                className="text-blue-600 hover:underline font-medium"
              >
                Login here
              </button>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
