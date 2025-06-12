
import { Checkbox } from "@/components/ui/checkbox";
import { useNavigate } from "react-router-dom";

interface TermsAcceptanceProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

export default function TermsAcceptance({ checked, onChange, disabled }: TermsAcceptanceProps) {
  const navigate = useNavigate();

  return (
    <div className="flex items-start space-x-2">
      <Checkbox
        id="terms"
        checked={checked}
        onCheckedChange={(checked) => onChange(checked as boolean)}
        disabled={disabled}
        className="mt-1"
      />
      <label htmlFor="terms" className="text-sm text-gray-700 leading-relaxed">
        ☑ I agree to the{" "}
        <button
          type="button"
          onClick={() => navigate("/terms-of-service")}
          className="text-blue-600 hover:underline font-medium"
        >
          Terms of Service
        </button>
        {" "}and{" "}
        <button
          type="button"
          onClick={() => navigate("/privacy-policy")}
          className="text-blue-600 hover:underline font-medium"
        >
          Privacy Policy
        </button>
      </label>
    </div>
  );
}
