
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface TaskBasicInfoProps {
  title: string;
  description: string;
  onUpdate: (updates: { title?: string; description?: string }) => void;
}

export const TaskBasicInfo = ({ title, description, onUpdate }: TaskBasicInfoProps) => {
  return (
    <>
      <div>
        <Label htmlFor="title">Task Title</Label>
        <Input
          id="title"
          placeholder="e.g. IKEA PAX Wardrobe Assembly"
          value={title}
          onChange={(e) => onUpdate({ title: e.target.value })}
          required
          className="mt-1"
        />
      </div>

      <div>
        <Label htmlFor="description">Detailed Description</Label>
        <Textarea
          id="description"
          placeholder="Describe what needs to be assembled, dimensions, special requirements..."
          value={description}
          onChange={(e) => onUpdate({ description: e.target.value })}
          required
          className="mt-1 min-h-[100px]"
        />
      </div>
    </>
  );
};
