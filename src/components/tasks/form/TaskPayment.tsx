
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { Database } from '@/integrations/supabase/types';

type PaymentMethod = Database['public']['Enums']['payment_method'];

interface TaskPaymentProps {
  paymentMethod: PaymentMethod;
  onUpdate: (updates: { paymentMethod: PaymentMethod }) => void;
}

export const TaskPayment = ({ paymentMethod, onUpdate }: TaskPaymentProps) => {
  return (
    <div>
      <Label>Payment Method</Label>
      <RadioGroup 
        value={paymentMethod} 
        onValueChange={(value: PaymentMethod) => onUpdate({ paymentMethod: value })}
        className="mt-2"
      >
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="cash" id="cash" />
          <Label htmlFor="cash">Cash</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="bank_transfer" id="bank" />
          <Label htmlFor="bank">Bank Transfer</Label>
        </div>
      </RadioGroup>
    </div>
  );
};
