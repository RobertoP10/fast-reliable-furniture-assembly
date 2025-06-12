
import { supabase } from "@/integrations/supabase/client";

export const fetchPendingTaskers = async () => {
  console.log('🔍 [ADMIN] Fetching pending taskers...');
  
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('role', 'tasker')
    .eq('approved', false)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ [ADMIN] Error fetching pending taskers:', error);
    throw error;
  }

  console.log('✅ [ADMIN] Fetched pending taskers:', data?.length || 0);
  return data || [];
};

export const approveTasker = async (taskerId: string) => {
  console.log('✅ [ADMIN] Approving tasker:', taskerId);
  
  // First check if the tasker exists and is actually pending
  const { data: existingTasker, error: checkError } = await supabase
    .from('users')
    .select('id, role, approved')
    .eq('id', taskerId)
    .eq('role', 'tasker')
    .single();

  if (checkError) {
    console.error('❌ [ADMIN] Error checking tasker:', checkError);
    throw new Error('Tasker not found');
  }

  if (!existingTasker) {
    console.error('❌ [ADMIN] Tasker not found:', taskerId);
    throw new Error('Tasker not found');
  }

  if (existingTasker.approved) {
    console.error('❌ [ADMIN] Tasker already approved:', taskerId);
    throw new Error('Tasker already approved');
  }

  const { data, error } = await supabase
    .from('users')
    .update({ approved: true })
    .eq('id', taskerId)
    .eq('role', 'tasker')
    .select();

  if (error) {
    console.error('❌ [ADMIN] Error approving tasker:', error);
    throw error;
  }

  if (!data || data.length === 0) {
    console.error('❌ [ADMIN] No rows updated for tasker:', taskerId);
    throw new Error('Failed to update tasker approval status');
  }

  console.log('✅ [ADMIN] Tasker approved successfully:', data);
  return data[0];
};

export const acceptTasker = approveTasker; // Alias for compatibility

export const rejectTasker = async (taskerId: string) => {
  console.log('❌ [ADMIN] Rejecting tasker:', taskerId);
  
  // Delete the tasker account entirely for rejection
  const { data, error } = await supabase
    .from('users')
    .delete()
    .eq('id', taskerId)
    .eq('role', 'tasker')
    .eq('approved', false) // Only delete if not approved yet
    .select();

  if (error) {
    console.error('❌ [ADMIN] Error rejecting tasker:', error);
    throw error;
  }

  if (!data || data.length === 0) {
    console.error('❌ [ADMIN] No tasker found to reject:', taskerId);
    throw new Error('Tasker not found or already processed');
  }

  console.log('✅ [ADMIN] Tasker account deleted successfully');
  return data;
};

export const fetchAllUsers = async () => {
  console.log('🔍 [ADMIN] Fetching all users...');
  
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ [ADMIN] Error fetching all users:', error);
    throw error;
  }

  console.log('✅ [ADMIN] Fetched all users:', data?.length || 0);
  return data || [];
};

// New functions for pending client tasks
export const fetchPendingClients = async () => {
  console.log('🔍 [ADMIN] Fetching pending client tasks...');
  
  const { data, error } = await supabase
    .from('task_requests')
    .select(`
      *,
      client:users!task_requests_client_id_fkey(
        id,
        full_name,
        email
      )
    `)
    .eq('needs_location_review', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ [ADMIN] Error fetching pending client tasks:', error);
    throw error;
  }

  console.log('✅ [ADMIN] Fetched pending client tasks:', data?.length || 0);
  return data || [];
};

export const approveClientTask = async (taskId: string) => {
  console.log('✅ [ADMIN] Approving client task:', taskId);
  
  const { data, error } = await supabase
    .from('task_requests')
    .update({ 
      needs_location_review: false,
      status: 'pending' // Make it visible to taskers
    })
    .eq('id', taskId)
    .eq('needs_location_review', true)
    .select();

  if (error) {
    console.error('❌ [ADMIN] Error approving client task:', error);
    throw error;
  }

  if (!data || data.length === 0) {
    console.error('❌ [ADMIN] No task found to approve:', taskId);
    throw new Error('Task not found or already processed');
  }

  console.log('✅ [ADMIN] Client task approved successfully:', data);
  return data[0];
};

export const rejectClientTask = async (taskId: string, rejectionReason?: string) => {
  console.log('❌ [ADMIN] Rejecting client task:', taskId);
  
  const { data, error } = await supabase
    .from('task_requests')
    .update({ 
      status: 'cancelled',
      needs_location_review: false,
      cancellation_reason: rejectionReason || 'Task rejected by admin due to location review'
    })
    .eq('id', taskId)
    .eq('needs_location_review', true)
    .select();

  if (error) {
    console.error('❌ [ADMIN] Error rejecting client task:', error);
    throw error;
  }

  if (!data || data.length === 0) {
    console.error('❌ [ADMIN] No task found to reject:', taskId);
    throw new Error('Task not found or already processed');
  }

  console.log('✅ [ADMIN] Client task rejected successfully');
  return data[0];
};
