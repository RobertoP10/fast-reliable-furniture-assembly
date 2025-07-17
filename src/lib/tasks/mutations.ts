import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const updateTaskStatus = async (taskId: string, status: string) => {
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

  const { data, error } = await supabase
    .from('task_requests')
    .update({ 
      status: 'cancelled',
      cancellation_reason: reason,
      cancelled_at: new Date().toISOString()
    })
    .eq('id', taskId)
    .select()
    .single();

  if (error) {
    console.error('❌ Error cancelling task:', error);
    throw error;
  }

  console.log('✅ Task cancelled successfully:', data);
  return data;
};

export const completeTask = async (taskId: string, completionProofUrls: string[]) => {
  console.log(`🔄 Completing task ${taskId} with proof URLs:`, completionProofUrls);

  const { data, error } = await supabase
    .from('task_requests')
    .update({ 
      status: 'completed',
      completion_proof_urls: completionProofUrls,
      completed_at: new Date().toISOString()
    })
    .eq('id', taskId)
    .select()
    .single();

  if (error) {
    console.error('❌ Error completing task:', error);
    throw error;
  }

  console.log('✅ Task completed successfully:', data);
  return data;
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

  // Trigger email notifications in background
  try {
    const notificationResponse = await fetch(`${supabase.supabaseUrl}/functions/v1/task-notification-handler`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabase.supabaseKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ task: data })
    });

    if (!notificationResponse.ok) {
      console.warn('⚠️ Email notification failed, but task was created successfully');
    } else {
      console.log('📧 Email notifications triggered successfully');
    }
  } catch (emailError) {
    console.warn('⚠️ Email notification error (task still created):', emailError);
  }

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
