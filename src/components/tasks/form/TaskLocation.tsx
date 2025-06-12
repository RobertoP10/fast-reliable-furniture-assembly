
import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { locations } from "./taskFormConstants";

interface TaskLocationProps {
  address: string;
  onUpdate: (updates: { address: string }) => void;
}

export const TaskLocation = ({ address, onUpdate }: TaskLocationProps) => {
  const [showOtherInput, setShowOtherInput] = useState(
    address && !locations.includes(address) && address !== 'Other (not listed)'
  );
  const [otherLocation, setOtherLocation] = useState(
    address && !locations.includes(address) ? address : ''
  );

  const handleLocationChange = (value: string) => {
    if (value === 'Other (not listed)') {
      setShowOtherInput(true);
      onUpdate({ address: otherLocation || '' });
    } else {
      setShowOtherInput(false);
      setOtherLocation('');
      onUpdate({ address: value });
    }
  };

  const handleOtherLocationChange = (value: string) => {
    setOtherLocation(value);
    onUpdate({ address: value });
  };

  return (
    <div className="space-y-2">
      <Label>Location</Label>
      <Select 
        value={showOtherInput ? 'Other (not listed)' : address} 
        onValueChange={handleLocationChange}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select your location" />
        </SelectTrigger>
        <SelectContent>
          {locations.map((location) => (
            <SelectItem key={location} value={location}>{location}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {showOtherInput && (
        <div>
          <Label className="text-sm text-gray-600">Enter your location</Label>
          <Input
            value={otherLocation}
            onChange={(e) => handleOtherLocationChange(e.target.value)}
            placeholder="Enter your location manually"
            className="mt-1"
          />
        </div>
      )}
    </div>
  );
};
