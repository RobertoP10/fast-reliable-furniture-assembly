
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
  
  const { data, error } = await supabase
    .from('users')
    .update({ approved: true })
    .eq('id', taskerId)
    .select();

  if (error) {
    console.error('❌ [ADMIN] Error approving tasker:', error);
    throw error;
  }

  console.log('✅ [ADMIN] Tasker approved successfully:', data);
  return data;
};

export const rejectTasker = async (taskerId: string) => {
  console.log('❌ [ADMIN] Rejecting tasker:', taskerId);
  
  const { error } = await supabase
    .from('users')
    .delete()
    .eq('id', taskerId);

  if (error) {
    console.error('❌ [ADMIN] Error rejecting tasker:', error);
    throw error;
  }

  console.log('✅ [ADMIN] Tasker rejected successfully');
  return true;
};
