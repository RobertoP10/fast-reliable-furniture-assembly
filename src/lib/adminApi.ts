
import { supabase } from "@/integrations/supabase/client";

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

export const fetchPendingTransactions = async () => {
  console.log('🔍 [ADMIN] Fetching pending transactions...');
  
  const { data, error } = await supabase
    .from('transactions')
    .select(`
      *,
      client:users!client_id(full_name, email),
      tasker:users!tasker_id(full_name, email)
    `)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ [ADMIN] Error fetching pending transactions:', error);
    throw error;
  }

  console.log('✅ [ADMIN] Fetched pending transactions:', data?.length || 0);
  return data || [];
};

export const acceptTasker = async (taskerId: string) => {
  console.log('✅ [ADMIN] Approving tasker:', taskerId);
  
  // Use update with proper return to ensure the operation completed
  const { data, error } = await supabase
    .from('users')
    .update({ approved: true })
    .eq('id', taskerId)
    .eq('role', 'tasker') // Additional safety check
    .select('*')
    .single();

  if (error) {
    console.error('❌ [ADMIN] Error approving tasker:', error);
    throw error;
  }

  if (!data) {
    console.error('❌ [ADMIN] No tasker found with ID:', taskerId);
    throw new Error('Tasker not found or could not be updated');
  }

  console.log('✅ [ADMIN] Tasker approved successfully:', data);
  return data;
};

export const rejectTasker = async (taskerId: string) => {
  console.log('❌ [ADMIN] Rejecting tasker:', taskerId);
  
  // First verify the user exists and is a pending tasker
  const { data: existingUser, error: fetchError } = await supabase
    .from('users')
    .select('id, role, approved')
    .eq('id', taskerId)
    .eq('role', 'tasker')
    .eq('approved', false)
    .single();

  if (fetchError || !existingUser) {
    console.error('❌ [ADMIN] Tasker not found or not pending:', fetchError);
    throw new Error('Tasker not found or not in pending state');
  }

  // Now delete the user
  const { error: deleteError } = await supabase
    .from('users')
    .delete()
    .eq('id', taskerId)
    .eq('role', 'tasker')
    .eq('approved', false);

  if (deleteError) {
    console.error('❌ [ADMIN] Error rejecting tasker:', deleteError);
    throw deleteError;
  }

  console.log('✅ [ADMIN] Tasker rejected and deleted successfully');
  return true;
};
