
import { useMemo } from "react";
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
  tasks: Task[];
  userRole: "client" | "tasker";
  userId: string;
  activeTab: "available" | "my-tasks" | "completed" | "received-offers" | "appointments";
}

export const useTaskFiltering = ({ tasks, userRole, userId, activeTab }: UseTaskFilteringProps) => {
  const filteredTasks = useMemo(() => {
    console.log("🔍 [FILTERING] Filtering tasks:", {
      totalTasks: tasks.length,
      userRole,
      userId,
      activeTab
    });

    if (!tasks || tasks.length === 0) {
      console.log("⚠️ [FILTERING] No tasks to filter");
      return [];
    }

    let filtered: Task[] = [];

    if (userRole === "client") {
      switch (activeTab) {
        case "my-tasks":
          // Client's own tasks that are pending
          filtered = tasks.filter(task => 
            task.client_id === userId && task.status === 'pending'
          );
          console.log("📋 [CLIENT] Pending requests:", filtered.length);
          break;

        case "received-offers":
          // Client's tasks that have received offers
          filtered = tasks.filter(task => 
            task.client_id === userId && 
            task.offers && 
            task.offers.length > 0 &&
            task.status === 'pending'
          );
          console.log("📨 [CLIENT] Tasks with received offers:", filtered.length);
          break;

        case "appointments":
          // Client's tasks with accepted offers (in progress)
          filtered = tasks.filter(task => 
            task.client_id === userId && 
            task.status === 'accepted' && 
            task.accepted_offer_id
          );
          console.log("📅 [CLIENT] Accepted tasks:", filtered.length);
          break;

        case "completed":
          // Client's completed tasks
          filtered = tasks.filter(task => 
            task.client_id === userId && task.status === 'completed'
          );
          console.log("✅ [CLIENT] Completed tasks:", filtered.length);
          break;

        default:
          filtered = tasks.filter(task => task.client_id === userId);
      }
    } 
    
    else if (userRole === "tasker") {
      switch (activeTab) {
        case "available":
          // Available tasks for taskers (pending, not their own)
          filtered = tasks.filter(task => 
            task.status === 'pending' && 
            task.client_id !== userId
          );
          console.log("🔍 [TASKER] Available tasks:", filtered.length);
          break;

        case "my-tasks":
          // Tasker's own offers
          filtered = tasks.filter(task => 
            task.offers && 
            task.offers.some(offer => offer.tasker_id === userId)
          );
          console.log("💼 [TASKER] My offers:", filtered.length);
          break;

        case "appointments":
          // Tasks where tasker's offer was accepted
          filtered = tasks.filter(task => 
            task.status === 'accepted' && 
            task.accepted_offer_id &&
            task.offers &&
            task.offers.some(offer => 
              offer.id === task.accepted_offer_id && 
              offer.tasker_id === userId
            )
          );
          console.log("📅 [TASKER] Appointments:", filtered.length);
          break;

        case "completed":
          // Completed tasks where tasker had the accepted offer
          filtered = tasks.filter(task => 
            task.status === 'completed' && 
            task.accepted_offer_id &&
            task.offers &&
            task.offers.some(offer => 
              offer.id === task.accepted_offer_id && 
              offer.tasker_id === userId
            )
          );
          console.log("✅ [TASKER] Completed tasks:", filtered.length);
          break;

        default:
          filtered = tasks;
      }
    }

    console.log("🎯 [FILTERING] Final filtered count:", filtered.length);
    return filtered;
  }, [tasks, userRole, userId, activeTab]);

  return filteredTasks;
};
