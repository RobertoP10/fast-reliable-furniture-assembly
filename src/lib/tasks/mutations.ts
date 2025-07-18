
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { TaskStatus } from "./types";

export const updateTaskStatus = async (taskId: string, status: TaskStatus) => {
  console.log(`🔄 Updating task ${taskId} to status: ${status}`);

  const { data, error } = await supabase
    .from('task_requests')
    .update({ status })
    .eq('id', taskId)
    .select()
    .single();

  if (error) {
    console.error('❌ Error updating task status:', error);
    throw error;
  }

  console.log('✅ Task status updated successfully:', data);
  return data;
};

export const cancelTask = async (taskId: string, reason: string) => {
  console.log(`🔄 Cancelling task ${taskId} with reason: ${reason}`);

  try {
    const { data, error } = await supabase
      .from('task_requests')
      .update({ 
        status: 'cancelled' as TaskStatus,
        cancellation_reason: reason,
        cancelled_at: new Date().toISOString()
      })
      .eq('id', taskId)
      .select()
      .single();

    if (error) {
      console.error('❌ Error cancelling task:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ Task cancelled successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('❌ Exception in cancelTask:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

export const completeTask = async (taskId: string, completionProofUrls: string[]) => {
  console.log(`🔄 Completing task ${taskId} with proof URLs:`, completionProofUrls);

  try {
    const { data, error } = await supabase
      .from('task_requests')
      .update({ 
        status: 'completed' as TaskStatus,
        completion_proof_urls: completionProofUrls,
        completed_at: new Date().toISOString()
      })
      .eq('id', taskId)
      .select()
      .single();

    if (error) {
      console.error('❌ Error completing task:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ Task completed successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('❌ Exception in completeTask:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

export const createTask = async (taskData: any) => {
  console.log('🔄 Creating task with data:', taskData);
  
  const { data, error } = await supabase
    .from('task_requests')
    .insert([taskData])
    .select()
    .single();

  if (error) {
    console.error('❌ Error creating task:', error);
    throw error;
  }

  console.log('✅ Task created successfully:', data);
  
  // Email notifications are now handled automatically by the database trigger
  // The notify_new_task() trigger will call the edge function via HTTP using pg_net
  console.log('📧 Email notifications will be triggered automatically by database trigger');
  
  return data;
};

export const updateTask = async (taskId: string, taskData: any) => {
  console.log(`🔄 Updating task ${taskId} with data:`, taskData);

  const { data, error } = await supabase
    .from('task_requests')
    .update(taskData)
    .eq('id', taskId)
    .select()
    .single();

  if (error) {
    console.error('❌ Error updating task:', error);
    throw error;
  }

  console.log('✅ Task updated successfully:', data);
  return data;
};

export const deleteTask = async (taskId: string) => {
  console.log(`🗑️ Deleting task ${taskId}`);

  const { data, error } = await supabase
    .from('task_requests')
    .delete()
    .eq('id', taskId);

  if (error) {
    console.error('❌ Error deleting task:', error);
    throw error;
  }

  console.log('✅ Task deleted successfully:', data);
  return data;
};

export const acceptOffer = async (taskId: string, offerId: string) => {
  console.log("🔄 [TASKS] Accepting offer:", offerId, "for task:", taskId);
  
  try {
    const { data, error } = await supabase.rpc('accept_offer_and_reject_others', {
      offer_id_param: offerId,
      task_id_param: taskId
    });

    if (error) {
      console.error('❌ [TASKS] Error in acceptOffer:', error);
      return { success: false, error: error.message };
    }

    if (!data) {
      return { success: false, error: "Failed to accept offer" };
    }

    console.log('✅ [TASKS] Offer accepted successfully via RPC');
    return { success: true };
  } catch (error) {
    console.error('❌ [TASKS] Unexpected error in acceptOffer:', error);
    return { success: false, error: (error as Error).message };
  }
};
