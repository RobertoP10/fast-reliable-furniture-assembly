
import { CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getStatusBadge } from "./getStatusBadge";
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

interface TaskCardHeaderProps {
  task: Task;
}

export const TaskCardHeader = ({ task }: TaskCardHeaderProps) => {
  return (
    <CardHeader>
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <CardTitle className="text-blue-900 mb-2">{task.title}</CardTitle>
          <CardDescription>{task.description}</CardDescription>
        </div>
        <div className="flex gap-2">
          {getStatusBadge(task.status)}
        </div>
      </div>
    </CardHeader>
  );
};
