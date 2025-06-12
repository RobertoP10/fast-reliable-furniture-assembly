
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
    throw new Error('Tasker not found or already approved');
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
    .select();

  if (error) {
    console.error('❌ [ADMIN] Error rejecting tasker:', error);
    throw error;
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
