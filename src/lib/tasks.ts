import { supabase } from "@/integrations/supabase/client";
import type { Database } from '@/integrations/supabase/types';

type Task = Database['public']['Tables']['task_requests']['Row'];
type TaskInsert = Database['public']['Tables']['task_requests']['Insert'];
type TaskUpdate = Database['public']['Tables']['task_requests']['Update'];
type TaskStatus = Database['public']['Enums']['task_status'];

export const fetchTasks = async (
  userId: string,
  userRole: string
): Promise<Task[]> => {
  console.log("🔍 [TASKS] Fetching tasks for:", userId, "role:", userRole);

  let query = supabase
    .from("task_requests")
    .select(
      `
      *,
      client:users!task_requests_client_id_fkey(full_name, location),
      accepted_offer:offers!task_requests_accepted_offer_id_fkey(
        id,
        price,
        tasker:users!offers_tasker_id_fkey(full_name)
      )
    `
    );

  if (userRole === "client") {
    query = query.eq("client_id", userId);
  } else if (userRole === "tasker") {
    const offerTaskIds = await getTaskIdsWithUserOffers(userId);
    query = query.or(`status.eq.pending,id.in.(${offerTaskIds})`);
  }

  const { data, error } = await query.order("created_at", { ascending: false });

  if (error) {
    console.error("❌ [TASKS] Error fetching tasks:", error);
    throw new Error(`Failed to fetch tasks: ${error.message}`);
  }

  return data || [];
};

const getTaskIdsWithUserOffers = async (userId: string): Promise<string> => {
  const { data, error } = await supabase
    .from("offers")
    .select("task_id")
    .eq("tasker_id", userId);

  if (error || !data?.length) return "";

  return data.map((o) => o.task_id).join(",");
};

export const createTask = async (
  taskData: Omit<TaskInsert, "id" | "created_at" | "updated_at">
): Promise<Task> => {
  const { data, error } = await supabase
    .from("task_requests")
    .insert(taskData)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create task: ${error.message}`);
  }

  return data;
};

export const updateTaskStatus = async (
  taskId: string,
  status: TaskStatus,
  updates?: Partial<TaskUpdate>
): Promise<void> => {
  const { error } = await supabase
    .from("task_requests")
    .update({ status, ...updates })
    .eq("id", taskId);

  if (error) {
    throw new Error(`Failed to update task status: ${error.message}`);
  }
};

export const fetchTask = async (taskId: string): Promise<Task | null> => {
  const { data, error } = await supabase
    .from("task_requests")
    .select(
      `
      *,
      client:users!task_requests_client_id_fkey(full_name, location),
      accepted_offer:offers!task_requests_accepted_offer_id_fkey(
        id,
        price,
        tasker:users!offers_tasker_id_fkey(full_name)
      )
    `
    )
    .eq("id", taskId)
    .single();

  if (error) {
    console.error("❌ Error fetching task:", error);
    return null;
  }

  return data;
};
