
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { locations } from "./constants";
import { TaskFormData } from "./utils/validation";

interface LocationAndPaymentProps {
  formData: TaskFormData;
  setFormData: (data: TaskFormData) => void;
}

const LocationAndPayment = ({ formData, setFormData }: LocationAndPaymentProps) => {
  return (
    <>
      <div>
        <Label>Location</Label>
        <Select value={formData.address} onValueChange={(value) => setFormData({ ...formData, address: value })}>
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

export default LocationAndPayment;
