import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { fetchTasks, acceptOffer } from "@/lib/api";
import MakeOfferDialog from "@/components/tasks/MakeOfferDialog";
import { TaskCard } from "@/components/tasks/TaskCard";
import { TaskFilters } from "@/components/tasks/TaskFilters";
import { CompletedTasksStats } from "@/components/tasks/CompletedTasksStats";
import type { Database } from "@/integrations/supabase/types";

// Types
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

interface TasksListProps {
  userRole: "client" | "tasker";
  tasks?: Task[];
}

const TasksList = ({ userRole, tasks: propTasks }: TasksListProps) => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"available" | "my-tasks" | "completed" | "received-offers">("available");
  const [completedCount, setCompletedCount] = useState<number>(0);
  const [completedTotal, setCompletedTotal] = useState<number>(0);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const loadData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const fetchedTasks = await fetchTasks(user.id, userRole).catch((error) => {
        console.error("❌ [TASKS] Fetch failed:", error);
        return [];
      });
      console.log("🔍 [TASKS] Fetched tasks:", JSON.stringify(fetchedTasks, null, 2));
      let filteredTasks = fetchedTasks;

      if (userRole === "tasker") {
        if (activeTab === "available") {
          filteredTasks = fetchedTasks.filter(task =>
            task.status === "pending" &&
            !(task.offers && Array.isArray(task.offers) && task.offers.some((offer) => offer.tasker_id === user.id))
          );
        } else if (activeTab === "my-tasks") {
          filteredTasks = fetchedTasks.filter(task =>
            task.offers && Array.isArray(task.offers) && task.offers.some((offer) => offer.tasker_id === user.id)
          );
        } else if (activeTab === "completed") {
          filteredTasks = fetchedTasks.filter(task => task.status === "completed");
        }
      } else if (userRole === "client") {
        if (activeTab === "available") {
          filteredTasks = fetchedTasks.filter(task => task.status === "pending");
        } else if (activeTab === "my-tasks") {
          filteredTasks = fetchedTasks.filter(task => task.status === "accepted");
        } else if (activeTab === "completed") {
          filteredTasks = fetchedTasks.filter(task => task.status === "completed");
        } else if (activeTab === "received-offers") {
          filteredTasks = fetchedTasks.filter(task =>
            task.status === "pending" &&
            task.offers &&
            Array.isArray(task.offers) &&
            task.offers.length > 0
          );
          console.log("🔍 [TASKS] Filtered tasks for received-offers:", JSON.stringify(filteredTasks, null, 2));
        }
      }

      if (activeTab === "completed") {
        const total = filteredTasks.reduce((sum, task) => {
          const accepted = task.offers?.find(o => o?.is_accepted);
          return sum + (accepted?.price ?? 0);
        }, 0);
        setCompletedCount(filteredTasks.length);
        setCompletedTotal(total);
      }

      setTasks(filteredTasks);
    } catch (error) {
      console.error("❌ Error loading tasks:", error);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!propTasks) {
      loadData();
    } else {
      setTasks(propTasks);
      setLoading(false);
    }
  }, [user, activeTab]);

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

      {loading ? (
        <Card><CardContent className="text-center py-8">Loading...</CardContent></Card>
      ) : tasks.length === 0 ? (
        <Card><CardContent className="text-center py-8">No tasks found.</CardContent></Card>
      ) : (
        <div className="grid gap-6">
          {tasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              userRole={userRole}
              user={user}
              onAccept={handleAcceptOffer}
              onMakeOffer={() => setSelectedTaskId(task.id)}
            />
          ))}
        </div>
      )}

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
