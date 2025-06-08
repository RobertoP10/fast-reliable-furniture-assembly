import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type TaskBase = Database["public"]["Tables"]["task_requests"]["Row"];
type OfferBase = Database["public"]["Tables"]["offers"]["Row"];
type UserBase = Database["public"]["Tables"]["users"]["Row"];

export type Offer = OfferBase & {
  tasker?: Pick<UserBase, "full_name" | "approved">;
};

export type Task = TaskBase & {
  offers?: Offer[];
  client?: Pick<UserBase, "full_name" | "location">;
};

// ✅ Fetch all tasks relevant to the user (based on role)
export const fetchTasks = async (
  userId: string,
  userRole: "client" | "tasker"
): Promise<Task[]> => {
  const { data, error } = await supabase
    .from("task_requests")
    .select(
      `
      *,
      offers (
        *,
        tasker:users!offers_tasker_id_fkey (
          full_name, approved
        )
      ),
      client:users!task_requests_client_id_fkey (
        full_name, location
      )
      `
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("❌ Error fetching tasks:", error);
    return [];
  }

  const parsedTasks: Task[] = (data ?? []).map((task) => ({
    ...task,
    offers: Array.isArray(task.offers)
      ? task.offers as Offer[]
      : task.offers
        ? [task.offers as Offer]
        : [],
    client: task.client,
  }));

  return parsedTasks;
};

// ✅ Fetch a single task by ID
export const fetchTaskById = async (taskId: string): Promise<Task | null> => {
  const { data, error } = await supabase
    .from("task_requests")
    .select(
      `
      *,
      offers (
        *,
        tasker:users!offers_tasker_id_fkey (
          full_name, approved
        )
      ),
      client:users!task_requests_client_id_fkey (
        full_name, location
      )
      `
    )
    .eq("id", taskId)
    .single();

  if (error) {
    console.error("❌ Error fetching task by ID:", error);
    return null;
  }

  return {
    ...data,
    offers: Array.isArray(data.offers)
      ? data.offers as Offer[]
      : data.offers
        ? [data.offers as Offer]
        : [],
    client: data.client,
  };
};

