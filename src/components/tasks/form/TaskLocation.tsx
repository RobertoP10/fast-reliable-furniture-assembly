
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { locations } from "./taskFormConstants";

interface TaskLocationProps {
  address: string;
  onUpdate: (updates: { address: string }) => void;
}

export const TaskLocation = ({ address, onUpdate }: TaskLocationProps) => {
  return (
    <div>
      <Label>Location</Label>
      <Select value={address} onValueChange={(value) => onUpdate({ address: value })}>
        <SelectTrigger className="mt-1">
          <SelectValue placeholder="Select your location" />
        </SelectTrigger>
        <SelectContent>
          {locations.map((location) => (
            <SelectItem key={location} value={location}>{location}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
