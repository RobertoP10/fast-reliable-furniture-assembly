
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { taskCategories, categoryDisplayNames } from "./utils/taskCategories";
import { taskLocations } from "./utils/taskLocations";

interface TaskFormData {
  title: string;
  description: string;
  category: string;
  subcategory: string;
  minBudget: string;
  maxBudget: string;
  address: string;
  paymentMethod: string;
}

interface TaskFormFieldsProps {
  formData: TaskFormData;
  setFormData: (data: TaskFormData) => void;
}

const TaskFormFields = ({ formData, setFormData }: TaskFormFieldsProps) => {
  return (
    <>
      <div>
        <Label htmlFor="title">Task Title</Label>
        <Input
          id="title"
          placeholder="e.g. IKEA PAX Wardrobe Assembly"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
          className="mt-1"
        />
      </div>

      <div>
        <Label htmlFor="description">Detailed Description</Label>
        <Textarea
          id="description"
          placeholder="Describe what needs to be assembled, dimensions, special requirements..."
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          required
          className="mt-1 min-h-[100px]"
        />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Label>Category</Label>
          <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value, subcategory: "" })}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(categoryDisplayNames).map(([key, display]) => (
                <SelectItem key={key} value={key}>{display}</SelectItem>
              ))}
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
              {formData.category && taskCategories[formData.category as keyof typeof taskCategories]?.map((sub) => (
                <SelectItem key={sub} value={sub}>{sub}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

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

      <div>
        <Label>Location</Label>
        <Select value={formData.address} onValueChange={(value) => setFormData({ ...formData, address: value })}>
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="Select your location" />
          </SelectTrigger>
          <SelectContent>
            {taskLocations.map((location) => (
              <SelectItem key={location} value={location}>{location}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Payment Method</Label>
        <RadioGroup 
          value={formData.paymentMethod} 
          onValueChange={(value) => setFormData({ ...formData, paymentMethod: value })}
          className="mt-2"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="cash" id="cash" />
            <Label htmlFor="cash">Cash</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="bank" id="bank" />
            <Label htmlFor="bank">Bank Transfer</Label>
          </div>
        </RadioGroup>
      </div>
    </>
  );
};

export default TaskFormFields;
