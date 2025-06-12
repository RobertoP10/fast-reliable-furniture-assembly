
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

interface RegisterFormProps {
  onBack?: () => void;
  onSwitchToLogin?: () => void;
}

export default function RegisterForm({ onBack, onSwitchToLogin }: RegisterFormProps) {
  const { register } = useAuth();
  const navigate = useNavigate();
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

  const validatePhoneNumber = (phone: string) => {
    // Remove all spaces, dashes, and parentheses
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, "");
    
    // UK phone number patterns:
    // - Mobile: 07xxxxxxxxx (11 digits total)
    // - International mobile: +447xxxxxxxxx or 447xxxxxxxxx
    // - Landline: 01xxxxxxxxx, 02xxxxxxxxx, 03xxxxxxxxx (11 digits total)
    // - International landline: +441xxxxxxxxx, +442xxxxxxxxx, +443xxxxxxxxx
    
    const ukPatterns = [
      /^07\d{9}$/, // UK mobile (07xxxxxxxxx)
      /^\+447\d{9}$/, // International UK mobile (+447xxxxxxxxx)
      /^447\d{9}$/, // International UK mobile without + (447xxxxxxxxx)
      /^0[123]\d{9}$/, // UK landline (01/02/03xxxxxxxxx)
      /^\+44[123]\d{9}$/, // International UK landline (+441/2/3xxxxxxxxx)
      /^44[123]\d{9}$/, // International UK landline without + (441/2/3xxxxxxxxx)
    ];
    
    // Also accept other international formats (basic validation)
    const internationalPattern = /^\+\d{7,15}$/; // International format with country code
    
    return ukPatterns.some(pattern => pattern.test(cleanPhone)) || 
           internationalPattern.test(cleanPhone);
  };

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

    // Updated phone number validation
    if (!validatePhoneNumber(form.phone_number)) {
      setError("Please enter a valid phone number (e.g., 07440669983, +447440669983, or international format).");
      setLoading(false);
      return;
    }

    try {
      await register({
        ...form,
        terms_accepted_at: new Date().toISOString()
      });
      // AuthContext will handle the redirect
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

          <Select 
            value={form.role} 
            onValueChange={(value: "client" | "tasker") => setForm({ ...form, role: value })}
            disabled={loading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select your role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="client">Client (I need furniture assembled)</SelectItem>
              <SelectItem value="tasker">Tasker (I provide assembly services)</SelectItem>
            </SelectContent>
          </Select>

          {form.role === "tasker" && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
              <p className="text-yellow-800 text-sm">
                <strong>Note:</strong> Tasker accounts require manual approval by an admin before you can start offering services.
              </p>
            </div>
          )}

          <div className="flex items-start space-x-2">
            <Checkbox
              id="terms"
              checked={form.terms_accepted}
              onCheckedChange={(checked) => setForm({ ...form, terms_accepted: checked as boolean })}
              disabled={loading}
              className="mt-1"
            />
            <label htmlFor="terms" className="text-sm text-gray-700 leading-relaxed">
              I agree to the{" "}
              <button
                type="button"
                onClick={() => navigate("/terms-of-service")}
                className="text-blue-600 hover:underline font-medium"
              >
                Terms of Service
              </button>
              {" "}and Privacy Policy
            </label>
          </div>

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
