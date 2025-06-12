
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface RoleSelectionProps {
  value: "client" | "tasker";
  onChange: (value: "client" | "tasker") => void;
  disabled?: boolean;
}

export default function RoleSelection({ value, onChange, disabled }: RoleSelectionProps) {
  return (
    <>
      <Select 
        value={value} 
        onValueChange={onChange}
        disabled={disabled}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select your role" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="client">Client (I need furniture assembled)</SelectItem>
          <SelectItem value="tasker">Tasker (I provide assembly services)</SelectItem>
        </SelectContent>
      </Select>

      {value === "tasker" && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
          <p className="text-yellow-800 text-sm">
            <strong>Note:</strong> Tasker accounts require manual approval by an admin before you can start offering services.
          </p>
        </div>
      )}
    </>
  );
}
