
import type { Database } from "@/integrations/supabase/types";

type Task = Database["public"]["Tables"]["task_requests"]["Row"] & {
  offers?: any[] | null;
  client?: {
    full_name: string;
    location: string;
  };
};

interface TaskCancellationInfoProps {
  task: Task;
}

export const TaskCancellationInfo = ({ task }: TaskCancellationInfoProps) => {
  return (
    <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
      <p className="text-sm text-red-700 font-medium">❌ Task Cancelled</p>
      <p className="text-sm text-red-600 mt-1">
        This task has been cancelled by the client. Your offer is no longer valid.
      </p>
      {task.cancellation_reason && (
        <p className="text-xs text-red-600 mt-2">
          <strong>Reason:</strong> {task.cancellation_reason}
        </p>
      )}
    </div>
  );
};
