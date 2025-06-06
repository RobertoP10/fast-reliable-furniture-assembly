import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

// Tipuri locale
type Task = Database["public"]["Tables"]["task_requests"]["Row"];
type Offer = Database["public"]["Tables"]["offers"]["Row"];

// ✅ Fetch tasks în funcție de rolul utilizatorului
export const fetchTasks = async (
  userId: string,
  role: "client" | "tasker"
): Promise<(Task & { offers?: Offer[] })[]> => {
  let query = supabase
    .from("task_requests")
    .select(
      `
        *,
        offers(*)
      `
    )
    .order("created_at", { ascending: false });

  if (role === "client") {
    query = query.eq("client_id", userId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("❌ [TASKS] Error fetching tasks:", error);
    throw new Error("Failed to fetch tasks");
  }

  return data as (Task & { offers?: Offer[] })[];
};

// ✅ Creează un nou task
export const createTask = async (taskData: Partial<Task>) => {
  const { data, error } = await supabase
    .from("task_requests")
    .insert(taskData)
    .select()
    .single();

  if (error) {
    console.error("❌ [TASKS] Error creating task:", error);
    throw new Error("Failed to create task");
  }

  return data;
};

// ✅ Actualizează statusul unui task (ex: accepted, completed etc.)
export const updateTaskStatus = async (taskId: string, status: string) => {
  const { error } = await supabase
    .from("task_requests")
    .update({ status })
    .eq("id", taskId);

  if (error) {
    console.error("❌ [TASKS] Error updating task status:", error);
    throw new Error("Failed to update task status");
  }
};
