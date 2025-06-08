import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type TaskBase = Database["public"]["Tables"]["task_requests"]["Row"];
type Offer = Database["public"]["Tables"]["offers"]["Row"] & {
  tasker?: { full_name: string; approved: boolean };
};
type TaskInsert = Database["public"]["Tables"]["task_requests"]["Insert"];
type TaskUpdate = Database["public"]["Tables"]["task_requests"]["Update"];
type TaskStatus = Database["public"]["Enums"]["task_status"];

export type Task = TaskBase & {
  offers?: Offer[];
  client?: {
    full_name: string;
    location: string;
  };
};

// ✅ Fetch taskuri cu relații corecte
export const fetchTasks = async (
  userId: string,
  userRole: string
): Promise<Task[]> => {
  console.log("🔍 [TASKS] Fetching tasks for:", userId, "role:", userRole);

  let query = supabase
    .from("task_requests")
    .select(`
      *,
      offers:offers!offers_task_id_fkey(
        *,
        tasker:users!offers_tasker_id_fkey(full_name, approved)
      ),
      client:users!task_requests_client_id_fkey(full_name, location)
    `);

  if (userRole === "client") {
    query = query.eq("client_id", userId);
  } else if (userRole === "tasker") {
    query = query.neq("client_id", userId);
  }

  const { data, error } = await query.order("created_at", {
    ascending: false,
  });

  if (error) {
    console.error("❌ [TASKS] Error fetching tasks:", error);
    throw new Error(`Failed to fetch tasks: ${error.message}`);
  }

  const normalizedData = (data || []).map((task: any) => ({
    ...task,
    offers: Array.isArray(task.offers)
      ? task.offers
      : task.offers
      ? [task.offers]
      : [],
  }));

  console.log("✅ [TASKS] Fetched and normalized tasks:", normalizedData);
  return normalizedData;
};

// ✅ Creează un nou task
export const createTask = async (
  taskData: Omit<TaskInsert, "id" | "created_at" | "updated_at">
): Promise<Task> => {
  const { data, error } = await supabase
    .from("task_requests")
    .insert(taskData)
    .select()
    .single();

  if (error) throw new Error(`Failed to create task: ${error.message}`);
  return data;
};

// ✅ Update status (ex. completed)
export const updateTaskStatus = async (
  taskId: string,
  status: TaskStatus,
  updates?: Partial<TaskUpdate>
): Promise<void> => {
  const updateData: TaskUpdate = { status, ...updates };

  const { error } = await supabase
    .from("task_requests")
    .update(updateData)
    .eq("id", taskId);

  if (error) throw new Error(`Failed to update task status: ${error.message}`);
};

// ✅ Fetch un singur task cu relații
export const fetchTask = async (taskId: string): Promise<Task | null> => {
  const { data, error } = await supabase
    .from("task_requests")
    .select(`
      *,
      offers:offers!offers_task_id_fkey(
        *,
        tasker:users!offers_tasker_id_fkey(full_name, approved)
      ),
      client:users!task_requests_client_id_fkey(full_name, location)
    `)
    .eq("id", taskId)
    .single();

  if (error) {
    console.error("❌ [TASKS] Error fetching task:", error);
    return null;
  }

  const normalized = {
    ...data,
    offers: Array.isArray(data.offers)
      ? data.offers
      : data.offers
      ? [data.offers]
      : [],
  };

  console.log("✅ [TASKS] Fetched single task:", normalized);
  return normalized;
};
