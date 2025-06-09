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
  const { user, signOut } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"pending" | "accepted-tasks" | "completed" | "received-offers">("pending");
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
      let filteredTasks = fetchedTasks as Task[];

      if (userRole === "tasker") {
        if (activeTab === "available") {
          filteredTasks = filteredTasks.filter(task =>
            task.status === "pending" &&
            (!task.offers || !Array.isArray(task.offers) || !task.offers.some(offer => offer.tasker_id === user.id))
          );
        } else if (activeTab === "my-tasks") {
          filteredTasks = filteredTasks.filter(task =>
            task.offers && Array.isArray(task.offers) && task.offers.some(offer => offer.tasker_id === user.id)
          );
        } else if (activeTab === "completed") {
          filteredTasks = filteredTasks.filter(task => task.status === "completed");
        }
      } else if (userRole === "client") {
        if (activeTab === "pending") {
          filteredTasks = filteredTasks.filter(task => task.status === "pending" && task.client_id === user.id);
        } else if (activeTab === "accepted-tasks") {
          filteredTasks = filteredTasks.filter(task => task.status === "accepted" && task.client_id === user.id);
        } else if (activeTab === "completed") {
          filteredTasks = filteredTasks.filter(task => task.status === "completed" && task.client_id === user.id);
        } else if (activeTab === "received-offers") {
          filteredTasks = filteredTasks.filter(task =>
            task.status === "pending" &&
            task.client_id === user.id &&
            task.offers &&
            Array.isArray(task.offers) &&
            task.offers.length > 0
          );
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
  }, [user, activeTab, propTasks]);

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

  const handleSignOut = async () => {
    try {
      setLoading(true);
      await signOut();
      setTasks([]); // Resetează task-urile la deconectare
    } catch (error) {
      console.error("❌ Error signing out:", error);
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <TaskFilters
        activeTab={activeTab}
        userRole={userRole}
        onTabChange={setActiveTab}
      />
      <button onClick={handleSignOut} className="bg-red-500 text-white px-4 py-2 rounded">
        Sign Out
      </button>

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
          {tasks.map((task, index) => (
            <TaskCard
              key={task.id}
              task={task}
              userRole={userRole}
              user={user}
              activeTab={activeTab} // Trece activeTab ca prop
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