
import { useState } from "react";
import { acceptOffer } from "@/lib/api";
import MakeOfferDialog from "@/components/tasks/MakeOfferDialog";
import { TaskFilters } from "@/components/tasks/TaskFilters";
import { CompletedTasksStats } from "@/components/tasks/CompletedTasksStats";
import { TasksGrid } from "@/components/tasks/TasksGrid";
import { useTaskFiltering } from "@/components/tasks/TaskFiltering";
import type { Database } from "@/integrations/supabase/types";

// Types
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

interface TasksListProps {
  userRole: "client" | "tasker";
  tasks?: Task[];
}

const TasksList = ({ userRole, tasks: propTasks }: TasksListProps) => {
  const [activeTab, setActiveTab] = useState<"available" | "my-tasks" | "completed" | "received-offers">("available");
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const {
    tasks,
    loading,
    completedCount,
    completedTotal,
    loadData
  } = useTaskFiltering({ userRole, activeTab, propTasks });

  const handleOfferCreated = () => {
    setSelectedTaskId(null);
    loadData();
  };

  const handleAcceptOffer = async (taskId: string, offerId: string) => {
    const res = await acceptOffer(taskId, offerId);
    if (res.success) {
      loadData();
    } else {
      console.error("❌ Failed to accept offer:", res.error);
    }
  };

  const handleTaskUpdate = () => {
    loadData();
  };

  const handleMakeOffer = (taskId: string) => {
    setSelectedTaskId(taskId);
  };

  return (
    <div className="space-y-6">
      <TaskFilters
        activeTab={activeTab}
        userRole={userRole}
        onTabChange={setActiveTab}
      />

      {activeTab === "completed" && (
        <CompletedTasksStats
          completedCount={completedCount}
          completedTotal={completedTotal}
        />
      )}

      <TasksGrid
        tasks={tasks}
        loading={loading}
        userRole={userRole}
        user={{ id: "dummy" }} // This will be passed from parent or context
        activeTab={activeTab}
        onAccept={handleAcceptOffer}
        onMakeOffer={handleMakeOffer}
        onTaskUpdate={handleTaskUpdate}
      />

      {selectedTaskId && (
        <MakeOfferDialog
          taskId={selectedTaskId}
          onOfferCreated={handleOfferCreated}
        />
      )}
    </div>
  );
};

export default TasksList;
