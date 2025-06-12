
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { categories } from "./taskFormConstants";

interface TaskCategoryProps {
  category: string;
  subcategory: string;
  onUpdate: (updates: { category?: string; subcategory?: string }) => void;
}

export const TaskCategory = ({ category, subcategory, onUpdate }: TaskCategoryProps) => {
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <div>
        <Label>Category</Label>
        <Select 
          value={category} 
          onValueChange={(value) => onUpdate({ category: value, subcategory: "" })}
        >
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {Object.keys(categories).map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Subcategory / Model</Label>
        <Select 
          value={subcategory} 
          onValueChange={(value) => onUpdate({ subcategory: value })}
          disabled={!category}
        >
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="Select model" />
          </SelectTrigger>
          <SelectContent>
            {category && categories[category as keyof typeof categories]?.map((sub) => (
              <SelectItem key={sub} value={sub}>{sub}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
