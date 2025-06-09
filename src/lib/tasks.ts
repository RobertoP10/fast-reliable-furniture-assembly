import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { PostgrestError } from "@supabase/supabase-js";

type TaskBase = Database["public"]["Tables"]["task_requests"]["Row"];
type Offer = Database["public"]["Tables"]["offers"]["Row"] & {
  tasker?: { full_name: string; approved: boolean; created_at?: string; updated_at?: string };
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

export const fetchTasks = async (
  userId: string,
  userRole: string
): Promise<Task[]> => {
  console.log("🔍 [TASKS] Fetching tasks for:", userId, "role:", userRole);

  let query = supabase
    .from("task_requests")
    .select(`
      id,
      title,
      description,
      status,
      client_id,
      location,
      created_at,
      price_range_min,
      price_range_max,
      offers:offers_task_id_fkey (
        id,
        task_id,
        tasker_id,
        price,
        message,
        proposed_date,
        proposed_time,
        is_accepted,
        created_at,
        updated_at,
        tasker:users!offers_tasker_id_fkey(full_name, approved)
      ),
      client:users!task_requests_client_id_fkey(full_name, location)
    `)
    .order("created_at", { ascending: false });

  if (userRole === "client") {
    query = query.eq("client_id", userId);
  } else if (userRole === "tasker") {
    query = query
      .not("offers.tasker_id", "eq", userId) // Task-uri fără oferte de la utilizator
      .eq("status", "pending"); // Limitare la task-uri disponibile
  }

  const { data, error } = await query;

  if (error) {
    console.error("❌ [TASKS] Error fetching tasks:", error);
    throw new Error(`Failed to fetch tasks: ${error.message}`);
  }

  if (!data) {
    console.warn("⚠️ [TASKS] No data returned from Supabase");
    return [];
  }

  const normalizedData = data.map((task: any) => ({
    ...task,
    offers: Array.isArray(task.offers)
      ? task.offers
      : task.offers
      ? [task.offers]
      : null,
  }));

  console.log("✅ [TASKS] Fetched and normalized tasks:", JSON.stringify(normalizedData, null, 2));
  return normalizedData;
};

export const createTask = async (
  taskData: Omit<TaskInsert, "id" | "created_at" | "updated_at">
): Promise<Task> => {
  const { data, error } = await supabase
    .from("task_requests")
    .insert(taskData)
    .select(`
      *,
      offers:offers_task_id_fkey (
        id,
        task_id,
        tasker_id,
        price,
        message,
        proposed_date,
        proposed_time,
        is_accepted,
        created_at,
        updated_at,
        tasker:users!offers_tasker_id_fkey(full_name, approved)
      ),
      client:users!task_requests_client_id_fkey(full_name, location)
    `)
    .single();

  if (error) throw new Error(`Failed to create task: ${error.message}`);
  return data;
};

export const updateTaskStatus = async (
  taskId: string,
  status: TaskStatus,
  updates?: Partial<TaskUpdate>
): Promise<void> => {
  const updateData: TaskUpdate = { status, ...updates };

  const { error } = await supabase
    .from("task_requests")
    .update(updateData)
    .eq("id", taskId)
    .select();

  if (error) throw new Error(`Failed to update task status: ${error.message}`);
};

export const fetchTask = async (taskId: string): Promise<Task | null> => {
  const { data, error } = await supabase
    .from("task_requests")
    .select(`
      id,
      title,
      description,
      status,
      client_id,
      location,
      created_at,
      price_range_min,
      price_range_max,
      offers:offers_task_id_fkey (
        id,
        task_id,
        tasker_id,
        price,
        message,
        proposed_date,
        proposed_time,
        is_accepted,
        created_at,
        updated_at,
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

  if (!data) {
    console.warn("⚠️ [TASKS] No data returned for task:", taskId);
    return null;
  }

  const normalized = {
    ...data,
    offers: Array.isArray(data.offers)
      ? data.offers
      : data.offers
      ? [data.offers]
      : null,
  };

  console.log("✅ [TASKS] Fetched single task:", JSON.stringify(normalized, null, 2));
  return normalized;
};