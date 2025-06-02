
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const RegisterForm = () => {
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
    
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords don't match.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.role) {
      toast({
        title: "Error",
        description: "Please select a role.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        location: formData.location
      });
      
      if (formData.role === 'tasker') {
        toast({
          title: "Registration successful!",
          description: "Your tasker account will be reviewed and approved soon.",
        });
      } else {
        toast({
          title: "Registration successful!",
          description: "Welcome to MGSDEAL!",
        });
      }
    } catch (error) {
      toast({
        title: "Registration error",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
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
        />
      </div>

      <div>
        <Label htmlFor="role">Account type</Label>
        <Select value={formData.role} onValueChange={(value: "client" | "tasker") => setFormData({ ...formData, role: value })}>
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
        />
      </div>
      
      <div>
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          required
          className="mt-1"
        />
      </div>
      
      <div>
        <Label htmlFor="confirmPassword">Confirm password</Label>
        <Input
          id="confirmPassword"
          type="password"
          value={formData.confirmPassword}
          onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
          required
          className="mt-1"
        />
      </div>

      <Button
        type="submit"
        className="w-full bg-blue-600 hover:bg-blue-700"
        disabled={isLoading}
      >
        {isLoading ? "Loading..." : "Create account"}
      </Button>

      {formData.role === 'tasker' && (
        <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
          <p className="text-xs text-yellow-700">
            <strong>Note:</strong> Tasker accounts are manually verified before approval.
          </p>
        </div>
      )}
    </form>
  );
};

export default RegisterForm;
