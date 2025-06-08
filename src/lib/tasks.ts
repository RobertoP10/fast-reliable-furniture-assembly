
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type TaskBase = Database["public"]["Tables"]["task_requests"]["Row"];
type OfferRow = Database["public"]["Tables"]["offers"]["Row"];
type Offer = OfferRow & {
  tasker?: { full_name: string; approved?: boolean };
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

// Helper function to transform Supabase response to our Task type
const transformSupabaseTaskToTask = (supabaseTask: any): Task => {
  return {
    ...supabaseTask,
    offers: Array.isArray(supabaseTask.offers) ? supabaseTask.offers : (supabaseTask.offers ? [supabaseTask.offers] : [])
  };
};

// ✅ Fetch tasks with correct relationships
export const fetchTasks = async (
  userId: string,
  userRole: string
): Promise<Task[]> => {
  console.log("🔍 [TASKS] Fetching tasks for:", userId, "role:", userRole);

  let query = supabase
    .from("task_requests")
    .select(`
      *,
      offers(
        *,
        tasker:users(full_name, approved)
      ),
      client:users!task_requests_client_id_fkey(full_name, location)
    `)
    .eq("client_id", userId) // Filter only client's tasks
    .order("created_at", { ascending: false });

  const { data, error } = await query;

  if (error) {
    console.error("❌ [TASKS] Error fetching tasks:", error);
    throw new Error(`Failed to fetch tasks: ${error.message}`);
  }

  // Transform the data to match our Task type
  return (data || []).map(transformSupabaseTaskToTask);
};

// ✅ Create a new task
export const createTask = async (
  taskData: Omit<TaskInsert, "id" | "created_at" | "updated_at">
): Promise<Task> => {
  const { data, error } = await supabase
    .from("task_requests")
    .insert(taskData)
    .select()
    .single();

  if (error) throw new Error(`Failed to create task: ${error.message}`);
  return transformSupabaseTaskToTask(data);
};

// ✅ Update status (completed etc.)
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

// ✅ Fetch a single task with relationships
export const fetchTask = async (taskId: string): Promise<Task | null> => {
  const { data, error } = await supabase
    .from("task_requests")
    .select(`
      *,
      offers(
        *,
        tasker:users(full_name, approved)
      ),
      client:users!task_requests_client_id_fkey(full_name, location)
    `)
    .eq("id", taskId)
    .single();

  if (error) {
    console.error("❌ [TASKS] Error fetching task:", error);
    return null;
  }

  return transformSupabaseTaskToTask(data);
};
