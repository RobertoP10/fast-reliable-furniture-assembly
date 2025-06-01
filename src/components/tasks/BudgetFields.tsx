
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { TaskFormData } from "./utils/validation";

interface BudgetFieldsProps {
  formData: TaskFormData;
  setFormData: (data: TaskFormData) => void;
}

const BudgetFields = ({ formData, setFormData }: BudgetFieldsProps) => {
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <div>
        <Label htmlFor="minBudget">Minimum Budget (£)</Label>
        <Input
          id="minBudget"
          type="number"
          placeholder="50"
          value={formData.minBudget}
          onChange={(e) => setFormData({ ...formData, minBudget: e.target.value })}
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
          value={formData.maxBudget}
          onChange={(e) => setFormData({ ...formData, maxBudget: e.target.value })}
          required
          className="mt-1"
        />
      </div>
    </div>
  );
};

export default BudgetFields;
