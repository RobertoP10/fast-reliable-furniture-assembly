
import { supabase } from "@/integrations/supabase/client";
import type { Task, TaskInsert, TaskUpdate, TaskStatus } from "./types";

export const createTask = async (
  taskData: Omit<TaskInsert, "id" | "created_at">
): Promise<Task> => {
  const { data, error } = await supabase
    .from("task_requests")
    .insert(taskData)
    .select(`
      id,
      client_id,
      title,
      description,
      category,
      subcategory,
      price_range_min,
      price_range_max,
      location,
      payment_method,
      status,
      accepted_offer_id,
      required_date,
      required_time,
      completion_proof_urls,
      completed_at,
      cancelled_at,
      cancellation_reason,
      created_at,
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
  return data as Task;
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

export const acceptOffer = async (taskId: string, offerId: string): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log("🔄 [TASKS] Accepting offer:", offerId, "for task:", taskId);
    
    const { data, error } = await supabase.rpc('accept_offer_and_reject_others', {
      offer_id_param: offerId,
      task_id_param: taskId
    });

    if (error) {
      console.error("❌ [TASKS] Error accepting offer:", error);
      return { success: false, error: error.message };
    }

    console.log("✅ [TASKS] Offer accepted successfully");
    return { success: true };
  } catch (error) {
    console.error("❌ [TASKS] Unexpected error accepting offer:", error);
    return { success: false, error: (error as Error).message };
  }
};

export const cancelTask = async (taskId: string, reason?: string): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log("🔄 [TASKS] Cancelling task:", taskId, "with reason:", reason);
    
    const { data, error } = await supabase.rpc('cancel_task', {
      task_id_param: taskId,
      reason: reason
    });

    if (error) {
      console.error("❌ [TASKS] Error cancelling task:", error);
      return { success: false, error: error.message };
    }

    if (!data) {
      console.log("⚠️ [TASKS] Cannot cancel task - offer already accepted");
      return { success: false, error: "Cannot cancel task - offer already accepted" };
    }

    console.log("✅ [TASKS] Task cancelled successfully");
    return { success: true };
  } catch (error) {
    console.error("❌ [TASKS] Unexpected error cancelling task:", error);
    return { success: false, error: (error as Error).message };
  }
};

export const completeTask = async (taskId: string, proofUrls?: string[]): Promise<{ success: boolean; error?: string }> => {
  try {
    const { data, error } = await supabase.rpc('complete_task', {
      task_id_param: taskId,
      proof_urls: proofUrls
    });

    if (error) {
      console.error("❌ [TASKS] Error completing task:", error);
      return { success: false, error: error.message };
    }

    if (!data) {
      return { success: false, error: "Cannot complete task - invalid state" };
    }

    return { success: true };
  } catch (error) {
    console.error("❌ [TASKS] Unexpected error completing task:", error);
    return { success: false, error: (error as Error).message };
  }
};
