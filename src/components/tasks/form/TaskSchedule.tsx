
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface TaskScheduleProps {
  requiredDate: string;
  requiredTime: string;
  onUpdate: (updates: { requiredDate?: string; requiredTime?: string }) => void;
}

export const TaskSchedule = ({ requiredDate, requiredTime, onUpdate }: TaskScheduleProps) => {
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <div>
        <Label htmlFor="requiredDate">Required Date <span className="text-red-500">*</span></Label>
        <Input
          id="requiredDate"
          type="date"
          value={requiredDate}
          onChange={(e) => onUpdate({ requiredDate: e.target.value })}
          required
          className="mt-1"
          min={new Date().toISOString().split('T')[0]}
        />
        <p className="text-xs text-gray-500 mt-1">Taskers will follow this schedule</p>
      </div>
      <div>
        <Label htmlFor="requiredTime">Required Time <span className="text-red-500">*</span></Label>
        <Input
          id="requiredTime"
          type="time"
          value={requiredTime}
          onChange={(e) => onUpdate({ requiredTime: e.target.value })}
          required
          className="mt-1"
        />
        <p className="text-xs text-gray-500 mt-1">Preferred start time</p>
      </div>
    </div>
  );
};
