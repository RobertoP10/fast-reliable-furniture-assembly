
import { MapPin, Clock, PoundSterling, Calendar } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Offer = Database["public"]["Tables"]["offers"]["Row"] & {
  tasker?: { full_name: string; approved?: boolean; created_at?: string; updated_at?: string };
};

type Task = Database["public"]["Tables"]["task_requests"]["Row"] & {
  offers?: Offer[] | null;
  client?: {
    full_name: string;
    location: string;
  };
};

interface TaskCardInfoProps {
  task: Task;
}

export const TaskCardInfo = ({ task }: TaskCardInfoProps) => {
  return (
    <>
      <div className="grid md:grid-cols-3 gap-4 mb-4 text-sm text-gray-600">
        <div className="flex items-center space-x-2">
          <PoundSterling className="h-4 w-4" />
          <span>£{task.price_range_min} – £{task.price_range_max}</span>
        </div>
        <div className="flex items-center space-x-2">
          <MapPin className="h-4 w-4" />
          <span>{task.location}</span>
        </div>
        <div className="flex items-center space-x-2">
          <Clock className="h-4 w-4" />
          <span>{new Date(task.created_at).toLocaleDateString()}</span>
        </div>
      </div>

      {task.required_date && task.required_time && (
        <div className="flex items-center space-x-2 mb-4 text-sm text-blue-700 bg-blue-50 p-3 rounded-lg">
          <Calendar className="h-4 w-4" />
          <span>
            <strong>Required:</strong> {new Date(task.required_date).toLocaleDateString()} at {task.required_time}
          </span>
        </div>
      )}
    </>
  );
};
