
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
    // First verify the task exists and user has permission to complete it
    const { data: task, error: taskError } = await supabase
      .from('task_requests')
      .select(`
        id,
        status,
        client_id,
        accepted_offer_id,
        offers!inner(tasker_id, is_accepted)
      `)
      .eq('id', taskId)
      .eq('offers.is_accepted', true)
      .maybeSingle();

    if (taskError) {
      console.error('❌ Error fetching task:', taskError);
      return { success: false, error: taskError.message };
    }

    if (!task) {
      console.error('❌ Task not found or user does not have permission to complete it');
      return { success: false, error: 'Task not found or you do not have permission to complete it' };
    }

    if (task.status !== 'accepted') {
      console.error('❌ Task is not in accepted status:', task.status);
      return { success: false, error: `Task cannot be completed. Current status: ${task.status}` };
    }

    // Use the database function for task completion
    const { data: completionResult, error: completionError } = await supabase
      .rpc('complete_task', {
        task_id_param: taskId,
        proof_urls: completionProofUrls
      });

    if (completionError) {
      console.error('❌ Error completing task via RPC:', completionError);
      return { success: false, error: completionError.message };
    }

    if (!completionResult) {
      console.error('❌ Task completion failed - no result returned');
      return { success: false, error: 'Failed to complete task. You may not have permission or the task may not be in the correct status.' };
    }

    console.log('✅ Task completed successfully via RPC');
    return { success: true, data: { id: taskId, status: 'completed' } };
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
