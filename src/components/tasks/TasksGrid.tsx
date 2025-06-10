
import { Card, CardContent } from "@/components/ui/card";
import { TaskCard } from "@/components/tasks/TaskCard";
import type { Database } from "@/integrations/supabase/types";

type Offer = Database["public"]["Tables"]["offers"]["Row"] & {
  tasker?: { full_name: string; approved?: boolean; created_at?: string; updated_at?: string };
};

type TaskBase = Database["public"]["Tables"]["task_requests"]["Row"];

type Task = TaskBase & {
  offers?: Offer[] | null;
  client?: {
    full_name: string;
    location: string;
  };
};

interface TasksGridProps {
  tasks: Task[];
  loading: boolean;
  userRole: "client" | "tasker";
  user: any;
  activeTab: "available" | "my-tasks" | "completed" | "received-offers" | "appointments";
  onAccept: (taskId: string, offerId: string) => void;
  onMakeOffer: (taskId: string) => void;
  onTaskUpdate: () => void;
}

export const TasksGrid = ({
  tasks,
  loading,
  userRole,
  user,
  activeTab,
  onAccept,
  onMakeOffer,
  onTaskUpdate
}: TasksGridProps) => {
  if (loading) {
    return (
      <Card>
        <CardContent className="text-center py-8">Loading...</CardContent>
      </Card>
    );
  }

  if (tasks.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">No tasks found.</CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-6">
      {tasks.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          userRole={userRole}
          user={user}
          onAccept={onAccept}
          onMakeOffer={() => onMakeOffer(task.id)}
          onTaskUpdate={onTaskUpdate}
          activeTab={activeTab}
        />
      ))}
    </div>
  );
};
