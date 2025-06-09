
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
      let filteredTasks = fetchedTasks as Task[];

      // Filter tasks based on user role and active tab
      if (userRole === "client") {
        switch (activeTab) {
          case "available":
            // Pending tab: show only their own tasks where status = 'pending' and accepted_offer_id IS NULL
            filteredTasks = filteredTasks.filter(task =>
              task.status === "pending" && task.accepted_offer_id === null
            );
            break;
          case "my-tasks":
            // Accepted Tasks tab: show only their own tasks where accepted_offer_id IS NOT NULL
            filteredTasks = filteredTasks.filter(task =>
              task.accepted_offer_id !== null
            );
            break;
          case "completed":
            // Completed tab: show only their own tasks with status = 'completed'
            filteredTasks = filteredTasks.filter(task => task.status === "completed");
            break;
          case "received-offers":
            // Received Offers tab: show only their own tasks with status = 'pending' and at least one offer
            filteredTasks = filteredTasks.filter(task =>
              task.status === "pending" &&
              task.offers &&
              Array.isArray(task.offers) &&
              task.offers.length > 0
            );
            break;
        }
      } else if (userRole === "tasker") {
        switch (activeTab) {
          case "available":
            // Available tab: show tasks with status = 'pending' where the current tasker has NOT submitted an offer yet
            filteredTasks = filteredTasks.filter(task =>
              task.status === "pending" &&
              (!task.offers || !Array.isArray(task.offers) || !task.offers.some((offer) => offer.tasker_id === user.id))
            );
            break;
          case "my-tasks":
            // My Tasks tab: show tasks where the current tasker has submitted an offer
            filteredTasks = filteredTasks.filter(task =>
              task.offers && Array.isArray(task.offers) && task.offers.some((offer) => offer.tasker_id === user.id)
            );
            break;
          case "completed":
            // Completed tab: show tasks where status = 'completed' and accepted_offer_id is linked to one of the tasker's offers
            filteredTasks = filteredTasks.filter(task => {
              if (task.status !== "completed") return false;
              if (!task.offers || !Array.isArray(task.offers)) return false;
              
              const taskerOffer = task.offers.find(offer => offer.tasker_id === user.id);
              return taskerOffer && task.accepted_offer_id === taskerOffer.id;
            });
            break;
        }
      }

      // Calculate completed stats for completed tab
      if (activeTab === "completed") {
        let total = 0;
        
        if (userRole === "client") {
          // For clients, sum the price of accepted offers
          total = filteredTasks.reduce((sum: number, task: Task) => {
            const acceptedOffer = task.offers?.find(o => o?.id === task.accepted_offer_id);
            return sum + (acceptedOffer?.price ? Number(acceptedOffer.price) : 0);
          }, 0);
        } else if (userRole === "tasker") {
          // For taskers, sum the price of their accepted offers
          total = filteredTasks.reduce((sum: number, task: Task) => {
            const taskerOffer = task.offers?.find(o => o?.tasker_id === user.id && o?.id === task.accepted_offer_id);
            return sum + (taskerOffer?.price ? Number(taskerOffer.price) : 0);
          }, 0);
        }

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
          {tasks.map((task) => (
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
