
import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { fetchTasks } from "@/lib/tasks";
import type { Database } from "@/integrations/supabase/types";

type Offer = Database["public"]["Tables"]["offers"]["Row"] & {
  tasker?: { full_name: string; approved?: boolean; created_at?: string; updated_at?: string };
  task?: {
    id: string;
    title: string;
    description: string;
    location: string;
    status: string;
    created_at: string;
  };
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

interface UseTaskFilteringReturn {
  tasks: Task[];
  loading: boolean;
  completedCount: number;
  completedTotal: number;
  loadData: () => void;
}

export const useTaskFiltering = ({ userRole, activeTab, propTasks }: UseTaskFilteringProps): UseTaskFilteringReturn => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      console.log("🔄 [FILTERING] Loading data for:", { userRole, activeTab, userId: user.id });
      
      const fetchedTasks = await fetchTasks(user.id, userRole);
      setTasks(fetchedTasks);
      
      console.log("✅ [FILTERING] Loaded tasks:", fetchedTasks.length);
    } catch (error) {
      console.error("❌ [FILTERING] Error loading tasks:", error);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (propTasks) {
      setTasks(propTasks);
      setLoading(false);
    } else {
      loadData();
    }
  }, [user?.id, userRole, activeTab, propTasks]);

  const filteredTasks = useMemo(() => {
    const dataToFilter = propTasks || tasks;
    
    console.log("🔍 [FILTERING] Filtering tasks:", {
      totalTasks: dataToFilter.length,
      userRole,
      userId: user?.id,
      activeTab
    });

    if (!dataToFilter || dataToFilter.length === 0) {
      console.log("⚠️ [FILTERING] No tasks to filter");
      return [];
    }

    let filtered: Task[] = [];

    if (userRole === "client") {
      switch (activeTab) {
        case "available":
        case "my-tasks":
          // Client's own tasks that are pending
          filtered = dataToFilter.filter(task => 
            task.client_id === user?.id && task.status === 'pending'
          );
          console.log("📋 [CLIENT] Pending requests:", filtered.length);
          break;

        case "received-offers":
          // Client's tasks that have received offers and are still pending
          filtered = dataToFilter.filter(task => 
            task.client_id === user?.id && 
            task.offers && 
            task.offers.length > 0 &&
            task.status === 'pending'
          );
          console.log("📨 [CLIENT] Tasks with received offers:", filtered.length);
          break;

        case "appointments":
          // Client's tasks with accepted offers (in progress)
          filtered = dataToFilter.filter(task => 
            task.client_id === user?.id && 
            task.status === 'accepted'
          );
          console.log("📅 [CLIENT] Accepted tasks (appointments):", filtered.length);
          break;

        case "completed":
          // Client's completed tasks
          filtered = dataToFilter.filter(task => 
            task.client_id === user?.id && task.status === 'completed'
          );
          console.log("✅ [CLIENT] Completed tasks:", filtered.length);
          break;

        default:
          filtered = dataToFilter.filter(task => task.client_id === user?.id);
      }
    } 
    
    else if (userRole === "tasker") {
      switch (activeTab) {
        case "available":
          // Available tasks for taskers (pending, not their own)
          filtered = dataToFilter.filter(task => 
            task.status === 'pending' && 
            task.client_id !== user?.id
          );
          console.log("🔍 [TASKER] Available tasks:", filtered.length);
          break;

        case "my-tasks":
          // Tasker's own offers that are still pending or rejected
          filtered = dataToFilter.filter(task => 
            task.offers && 
            task.offers.some(offer => 
              offer.tasker_id === user?.id && 
              (offer.status === 'pending' || offer.status === 'rejected')
            )
          );
          console.log("💼 [TASKER] My pending/rejected offers:", filtered.length);
          break;

        case "appointments":
          // Tasks where tasker's offer was accepted
          filtered = dataToFilter.filter(task => 
            task.status === 'accepted' && 
            task.accepted_offer_id &&
            task.offers &&
            task.offers.some(offer => 
              offer.id === task.accepted_offer_id && 
              offer.tasker_id === user?.id
            )
          );
          console.log("📅 [TASKER] Appointments:", filtered.length);
          break;

        case "completed":
          // Completed tasks where tasker had the accepted offer
          filtered = dataToFilter.filter(task => 
            task.status === 'completed' && 
            task.accepted_offer_id &&
            task.offers &&
            task.offers.some(offer => 
              offer.id === task.accepted_offer_id && 
              offer.tasker_id === user?.id
            )
          );
          console.log("✅ [TASKER] Completed tasks:", filtered.length);
          break;

        default:
          filtered = dataToFilter;
      }
    }

    console.log("🎯 [FILTERING] Final filtered count:", filtered.length);
    return filtered;
  }, [tasks, propTasks, userRole, user?.id, activeTab]);

  const completedCount = useMemo(() => {
    return filteredTasks.filter(task => task.status === 'completed').length;
  }, [filteredTasks]);

  const completedTotal = useMemo(() => {
    const allTasks = propTasks || tasks;
    if (userRole === "client") {
      return allTasks.filter(task => task.client_id === user?.id && task.status === 'completed').length;
    } else {
      return allTasks.filter(task => 
        task.status === 'completed' && 
        task.accepted_offer_id &&
        task.offers &&
        task.offers.some(offer => 
          offer.id === task.accepted_offer_id && 
          offer.tasker_id === user?.id
        )
      ).length;
    }
  }, [tasks, propTasks, userRole, user?.id]);

  return {
    tasks: filteredTasks,
    loading,
    completedCount,
    completedTotal,
    loadData
  };
};
