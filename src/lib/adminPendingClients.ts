
import { supabase } from "@/integrations/supabase/client";

export const fetchPendingClients = async () => {
  console.log('🔍 [ADMIN] Fetching pending client tasks...');
  
  const { data, error } = await supabase
    .from('task_requests')
    .select(`
      *,
      client:users!task_requests_client_id_fkey(
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
    .update({ needs_location_review: false })
    .eq('id', taskId)
    .select();

  if (error) {
    console.error('❌ [ADMIN] Error approving client task:', error);
    throw error;
  }

  console.log('✅ [ADMIN] Client task approved successfully:', data);
  return data;
};

export const rejectClientTask = async (taskId: string, rejectionReason?: string) => {
  console.log('❌ [ADMIN] Rejecting client task:', taskId);
  
  // For now, we'll set the task status to 'cancelled' with a reason
  const { data, error } = await supabase
    .from('task_requests')
    .update({ 
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      cancellation_reason: rejectionReason || 'Task rejected due to location outside service area'
    })
    .eq('id', taskId)
    .select();

  if (error) {
    console.error('❌ [ADMIN] Error rejecting client task:', error);
    throw error;
  }

  console.log('✅ [ADMIN] Client task rejected successfully');
  return data;
};
