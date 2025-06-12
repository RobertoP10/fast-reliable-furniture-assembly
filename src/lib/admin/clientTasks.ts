
import { supabase } from "@/integrations/supabase/client";

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
