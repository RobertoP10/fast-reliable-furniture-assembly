import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Task = Database["public"]["Tables"]["task_requests"]["Row"];
type TaskInsert = Database["public"]["Tables"]["task_requests"]["Insert"];
type TaskUpdate = Database["public"]["Tables"]["task_requests"]["Update"];
type TaskStatus = Database["public"]["Enums"]["task_status"];

// ✅ Fetch tasks based on user role
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
      offers(*),
      client:users!task_requests_client_id_fkey(full_name, location)
    `
    );

  if (userRole === "client") {
    // Clientul vede doar propriile taskuri
    query = query.eq("client_id", userId);
  } else if (userRole === "tasker") {
    // Taskerii văd doar taskurile deschise
    query = query.eq("status", "pending");
  }

  const { data, error } = await query.order("created_at", {
    ascending: false,
  });

  if (error) {
    console.error("❌ [TASKS] Error fetching tasks:", error);
    throw new Error(`Failed to fetch tasks: ${error.message}`);
  }

  console.log("✅ [TASKS] Tasks fetched successfully:", data?.length || 0);
  return data || [];
};

// ✅ Creează un nou task
export const createTask = async (
  taskData: Omit<TaskInsert, "id" | "created_at" | "updated_at">
): Promise<Task> => {
  console.log("📝 [TASKS] Creating new task:", taskData.title);

  const { data, error } = await supabase
    .from("task_requests")
    .insert(taskData)
    .select()
    .single();

  if (error) {
    console.error("❌ [TASKS] Error creating task:", error);
    throw new Error(`Failed to create task: ${error.message}`);
  }

  console.log("✅ [TASKS] Task created successfully with ID:", data.id);
  return data;
};

// ✅ Update statusul unui task (ex: la "completed")
export const updateTaskStatus = async (
  taskId: string,
  status: TaskStatus,
  updates?: Partial<TaskUpdate>
): Promise<void> => {
  console.log("📝 [TASKS] Updating task status:", taskId, "to", status);

  const updateData: TaskUpdate = { status, ...updates };

  const { error } = await supabase
    .from("task_requests")
    .update(updateData)
    .eq("id", taskId);

  if (error) {
    console.error("❌ [TASKS] Error updating task status:", error);
    throw new Error(`Failed to update task status: ${error.message}`);
  }

  console.log("✅ [TASKS] Task status updated successfully");
};

// ✅ Fetch single task
export const fetchTask = async (taskId: string): Promise<Task | null> => {
  console.log("🔍 [TASKS] Fetching single task:", taskId);

  const { data, error } = await supabase
    .from("task_requests")
    .select(
      `
      *,
      offers(*),
      client:users!task_requests_client_id_fkey(full_name, location)
    `
    )
    .eq("id", taskId)
    .single();

  if (error) {
    console.error("❌ [TASKS] Error fetching task:", error);
    return null;
  }

  console.log("✅ [TASKS] Task fetched successfully");
  return data;
};
