import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type TaskBase = Database["public"]["Tables"]["task_requests"]["Row"];
type Offer = Database["public"]["Tables"]["offers"]["Row"] & {
  tasker?: { full_name: string; approved?: boolean };
};
type TaskInsert = Database["public"]["Tables"]["task_requests"]["Insert"];
type TaskUpdate = Database["public"]["Tables"]["task_requests"]["Update"];
type TaskStatus = Database["public"]["Enums"]["task_status"];

export type Task = TaskBase & {
  offers?: Offer[] | null;
  client?: {
    full_name: string;
    location: string;
  };
};

// ✅ Fetch taskuri cu opțiune de filtrare după oferte
export const fetchTasks = async (
  userId: string,
  userRole: string,
  onlyWithOffers: boolean = false
): Promise<Task[]> => {
  console.log("🔍 [TASKS] Fetching tasks for:", userId, "role:", userRole, "onlyWithOffers:", onlyWithOffers);

  // Construim interogarea
  let query = supabase
    .from("task_requests")
    .select(`
      *,
      ${onlyWithOffers ? "offers!inner" : "offers"} (
        id,
        task_id,
        tasker_id,
        price,
        message,
        proposed_date,
        proposed_time,
        is_accepted,
        tasker:users(full_name, approved)
      ),
      client:users!task_requests_client_id_fkey(full_name, location)
    `)
    .order("created_at", { ascending: false });

  // Filtrare pe rol
  if (userRole === "client") {
    query = query.eq("client_id", userId);
  } else if (userRole === "tasker") {
    // pentru tasker momentan nu e nevoie de filtrare
  }

  const { data, error } = await query;

  if (error) {
    console.error("❌ [TASKS] Error fetching tasks:", error);
    throw new Error(`Failed to fetch tasks: ${error.message}`);
  }

  const transformedData = (data || []).map((task) => ({
    ...task,
    offers: Array.isArray(task.offers)
      ? task.offers
      : task.offers
        ? [task.offers]
        : null,
  }));

  console.log("🔍 [TASKS] Transformed tasks:", transformedData);
  return transformedData;
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

// ✅ Fetch un singur task cu relații
export const fetchTask = async (taskId: string): Promise<Task | null> => {
  const { data, error } = await supabase
    .from("task_requests")
    .select(`
      *,
      offers (
        id,
        task_id,
        tasker_id,
        price,
        message,
        proposed_date,
        proposed_time,
        is_accepted,
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

  return {
    ...data,
    offers: Array.isArray(data.offers)
      ? data.offers
      : data.offers
        ? [data.offers]
        : null,
  };
};
