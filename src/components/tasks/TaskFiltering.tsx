
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { fetchTasks } from "@/lib/tasks";
import { fetchUserOffers } from "@/lib/offers";
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
    if (!user) {
      console.warn("⚠️ [TASKS] No user found, cannot load data");
      return;
    }

    try {
      setLoading(true);
      console.log(`🔍 [TASKS] Loading data for ${userRole} user:`, user.id, "tab:", activeTab);
      
      // For My Offers tab, we need to fetch offers separately
      if (userRole === "tasker" && activeTab === "my-tasks") {
        console.log("🔍 [OFFERS] Fetching user offers for tasker:", user.id);
        
        const userOffers = await fetchUserOffers(user.id).catch((error) => {
          console.error("❌ [OFFERS] Fetch user offers failed:", error);
          return [];
        });
        
        console.log("✅ [OFFERS] Fetched user offers:", userOffers.length);
        
        // Transform offers into task format for display
        const tasksFromOffers = userOffers.map(offer => ({
          ...offer.task,
          offers: [offer]
        })).filter(task => task.id) as Task[];
        
        console.log("✅ [TASKS] Transformed offers to tasks:", tasksFromOffers.length);
        setTasks(tasksFromOffers);
        setLoading(false);
        return;
      }
      
      // For all other tabs, fetch tasks normally
      const fetchedTasks = await fetchTasks(user.id, userRole).catch((error) => {
        console.error("❌ [TASKS] Fetch failed:", error);
        return [];
      });
      
      let filteredTasks = fetchedTasks as Task[];
      console.log(`🔍 [TASKS] Raw tasks from DB:`, filteredTasks.length);

      // Filter tasks based on user role and active tab with detailed logging
      if (userRole === "client") {
        switch (activeTab) {
          case "available":
            // Pending Requests: show only client's tasks with status = 'pending'
            filteredTasks = filteredTasks.filter(task => {
              const matches = task.client_id === user.id && task.status === "pending";
              if (matches) {
                console.log(`✅ [CLIENT-PENDING] Task ${task.id}: ${task.title} (status: ${task.status})`);
              }
              return matches;
            });
            break;
          case "my-tasks":
            // Accepted Tasks: show only client's tasks with status = 'accepted'
            filteredTasks = filteredTasks.filter(task => {
              const matches = task.client_id === user.id && task.status === "accepted";
              if (matches) {
                console.log(`✅ [CLIENT-ACCEPTED] Task ${task.id}: ${task.title} (status: ${task.status})`);
              }
              return matches;
            });
            break;
          case "completed":
            // Completed Tasks: show only client's tasks with status = 'completed'
            filteredTasks = filteredTasks.filter(task => {
              const matches = task.client_id === user.id && task.status === "completed";
              if (matches) {
                console.log(`✅ [CLIENT-COMPLETED] Task ${task.id}: ${task.title} (status: ${task.status})`);
              }
              return matches;
            });
            break;
          case "received-offers":
            // Received Offers: show only client's tasks with status = 'pending' and at least one offer
            filteredTasks = filteredTasks.filter(task => {
              const hasOffers = task.offers && Array.isArray(task.offers) && task.offers.length > 0;
              const matches = task.client_id === user.id && task.status === "pending" && hasOffers;
              if (matches) {
                console.log(`✅ [CLIENT-OFFERS] Task ${task.id}: ${task.title} (${task.offers?.length} offers)`);
              }
              return matches;
            });
            break;
        }
      } else if (userRole === "tasker") {
        switch (activeTab) {
          case "available":
            // Available Tasks: show all pending tasks where tasker hasn't submitted an offer yet
            // AND exclude tasks owned by the current user
            filteredTasks = filteredTasks.filter(task => {
              const notOwnTask = task.client_id !== user.id;
              const isPending = task.status === "pending";
              const noOfferYet = !task.offers || !Array.isArray(task.offers) || !task.offers.some((offer) => offer.tasker_id === user.id);
              const matches = notOwnTask && isPending && noOfferYet;
              if (matches) {
                console.log(`✅ [TASKER-AVAILABLE] Task ${task.id}: ${task.title} (status: ${task.status}, no offer yet)`);
              }
              return matches;
            });
            break;
          case "appointments":
            // Appointments: show tasks where current tasker's offer was accepted
            // Filter strictly by: task.status = 'accepted' AND current tasker's offer is the accepted one
            filteredTasks = filteredTasks.filter(task => {
              if (task.status !== "accepted" || !task.accepted_offer_id) return false;
              if (!task.offers || !Array.isArray(task.offers)) return false;
              
              // Check if current tasker's offer is the accepted one
              const myOffer = task.offers.find(offer => offer.tasker_id === user.id);
              const matches = myOffer && task.accepted_offer_id === myOffer.id && myOffer.status === 'accepted';
              if (matches) {
                console.log(`✅ [TASKER-APPOINTMENTS] Task ${task.id}: ${task.title} (accepted offer: ${myOffer.id})`);
              }
              return matches;
            });
            break;
          case "completed":
            // Completed: show tasks where status = 'completed' and current tasker was the accepted tasker
            filteredTasks = filteredTasks.filter(task => {
              if (task.status !== "completed" || !task.accepted_offer_id) return false;
              if (!task.offers || !Array.isArray(task.offers)) return false;
              
              // Check if current tasker was the accepted tasker for this completed task
              const myOffer = task.offers.find(offer => offer.tasker_id === user.id);
              const matches = myOffer && task.accepted_offer_id === myOffer.id;
              if (matches) {
                console.log(`✅ [TASKER-COMPLETED] Task ${task.id}: ${task.title} (completed by me)`);
              }
              return matches;
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

      console.log(`✅ [TASKS] Final filtered tasks for ${activeTab}:`, filteredTasks.length);
      setTasks(filteredTasks);
    } catch (error) {
      console.error("❌ [TASKS] Error loading tasks:", error);
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
