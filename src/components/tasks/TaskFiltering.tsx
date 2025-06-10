
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { fetchTasks } from "@/lib/tasks";
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

interface UseTaskFilteringProps {
  userRole: "client" | "tasker";
  activeTab: "available" | "my-tasks" | "completed" | "received-offers" | "appointments";
  propTasks?: Task[];
}

export const useTaskFiltering = ({ userRole, activeTab, propTasks }: UseTaskFilteringProps) => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [completedCount, setCompletedCount] = useState<number>(0);
  const [completedTotal, setCompletedTotal] = useState<number>(0);

  const loadData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const fetchedTasks = await fetchTasks(user.id, userRole).catch((error) => {
        console.error("❌ [TASKS] Fetch failed:", error);
        return [];
      });
      
      let filteredTasks = fetchedTasks as Task[];

      // Filter tasks based on user role and active tab
      if (userRole === "client") {
        switch (activeTab) {
          case "available":
            // Pending Requests: show only client's tasks with status = 'pending'
            filteredTasks = filteredTasks.filter(task =>
              task.client_id === user.id && task.status === "pending"
            );
            break;
          case "my-tasks":
            // Accepted Tasks: show only client's tasks with status = 'accepted'
            filteredTasks = filteredTasks.filter(task =>
              task.client_id === user.id && task.status === "accepted"
            );
            break;
          case "completed":
            // Completed Tasks: show only client's tasks with status = 'completed'
            filteredTasks = filteredTasks.filter(task => 
              task.client_id === user.id && task.status === "completed"
            );
            break;
          case "received-offers":
            // Received Offers: show only client's tasks with status = 'pending' and at least one offer
            filteredTasks = filteredTasks.filter(task =>
              task.client_id === user.id &&
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
            // Available Tasks: show tasks with status = 'pending' where the current tasker has NOT submitted an offer yet
            filteredTasks = filteredTasks.filter(task =>
              task.status === "pending" &&
              task.client_id !== user.id && // Don't show own tasks
              (!task.offers || !Array.isArray(task.offers) || !task.offers.some((offer) => offer.tasker_id === user.id))
            );
            break;
          case "appointments":
            // Appointments: show tasks where status = 'accepted' and current tasker was the one whose offer was accepted
            filteredTasks = filteredTasks.filter(task => {
              if (task.status !== "accepted") return false;
              if (!task.offers || !Array.isArray(task.offers)) return false;
              
              // Check if current tasker was the accepted tasker
              const taskerOffer = task.offers.find(offer => offer.tasker_id === user.id);
              return taskerOffer && task.accepted_offer_id === taskerOffer.id;
            });
            break;
          case "completed":
            // Completed: show tasks where status = 'completed' and current tasker was the one who marked it completed
            filteredTasks = filteredTasks.filter(task => {
              if (task.status !== "completed") return false;
              if (!task.offers || !Array.isArray(task.offers)) return false;
              
              // Check if current tasker was the accepted tasker for this completed task
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

      console.log(`✅ [TASKS] Filtered tasks for ${activeTab}:`, filteredTasks.length);
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

  return {
    tasks,
    loading,
    completedCount,
    completedTotal,
    loadData
  };
};
