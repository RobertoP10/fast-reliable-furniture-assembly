
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { locations } from "./taskFormConstants";

interface TaskLocationProps {
  address: string;
  manualAddress: string;
  onUpdate: (updates: { address?: string; manualAddress?: string }) => void;
}

export const TaskLocation = ({ address, manualAddress, onUpdate }: TaskLocationProps) => {
  const isOtherSelected = address === "Other (not listed)";

  return (
    <div className="space-y-3">
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

      {isOtherSelected && (
        <div className="space-y-3">
          <div>
            <Label htmlFor="manualAddress">Please enter your full address:</Label>
            <Input
              id="manualAddress"
              placeholder="Enter your full address"
              value={manualAddress}
              onChange={(e) => onUpdate({ manualAddress: e.target.value })}
              className="mt-1"
              required
            />
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
            <p className="text-yellow-800 text-sm">
              <strong>Note:</strong> Your location is outside our standard service area. The task will be manually reviewed before being accepted.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
