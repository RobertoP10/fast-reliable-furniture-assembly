
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { categories } from "./constants";
import { TaskFormData } from "./utils/validation";

interface CategorySelectionProps {
  formData: TaskFormData;
  setFormData: (data: TaskFormData) => void;
}

const CategorySelection = ({ formData, setFormData }: CategorySelectionProps) => {
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <div>
        <Label>Category</Label>
        <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value, subcategory: "" })}>
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="wardrobe">Wardrobe</SelectItem>
            <SelectItem value="desk">Desk</SelectItem>
            <SelectItem value="bed">Bed</SelectItem>
            <SelectItem value="chest">Chest of Drawers</SelectItem>
            <SelectItem value="table">Table</SelectItem>
            <SelectItem value="shelf">Shelf</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Subcategory / Model</Label>
        <Select 
          value={formData.subcategory} 
          onValueChange={(value) => setFormData({ ...formData, subcategory: value })}
          disabled={!formData.category}
        >
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="Select model" />
          </SelectTrigger>
          <SelectContent>
            {formData.category && categories[formData.category as keyof typeof categories]?.map((sub) => (
              <SelectItem key={sub} value={sub}>{sub}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default CategorySelection;
