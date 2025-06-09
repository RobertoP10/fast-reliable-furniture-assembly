
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface TaskBudgetProps {
  minBudget: string;
  maxBudget: string;
  onUpdate: (updates: { minBudget?: string; maxBudget?: string }) => void;
}

export const TaskBudget = ({ minBudget, maxBudget, onUpdate }: TaskBudgetProps) => {
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <div>
        <Label htmlFor="minBudget">Minimum Budget (£)</Label>
        <Input
          id="minBudget"
          type="number"
          placeholder="50"
          value={minBudget}
          onChange={(e) => onUpdate({ minBudget: e.target.value })}
          required
          className="mt-1"
        />
      </div>
      <div>
        <Label htmlFor="maxBudget">Maximum Budget (£)</Label>
        <Input
          id="maxBudget"
          type="number"
          placeholder="120"
          value={maxBudget}
          onChange={(e) => onUpdate({ maxBudget: e.target.value })}
          required
          className="mt-1"
        />
      </div>
    </div>
  );
};
