import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { acceptOffer } from "@/lib/tasks";
import { useToast } from "@/hooks/use-toast";
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
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"available" | "my-tasks" | "completed" | "received-offers" | "appointments">("available");
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
    console.log("🔄 [CLIENT] Accepting offer:", offerId, "for task:", taskId);
    
    const result = await acceptOffer(taskId, offerId);
    if (result.success) {
      toast({ title: "✅ Offer accepted successfully!" });
      loadData(); // Refresh the data
    } else {
      toast({ 
        title: "❌ Failed to accept offer", 
        description: result.error,
        variant: "destructive" 
      });
    }
  };

  const handleTaskUpdate = () => {
    loadData();
  };

  const handleMakeOffer = (taskId: string) => {
    setSelectedTaskId(taskId);
  };

  if (!user) {
    return <div>Please log in to view tasks.</div>;
  }

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
        user={user}
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
