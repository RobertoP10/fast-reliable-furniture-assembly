
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
  console.log('✅ [ADMIN] Approving tasker with ID:', taskerId);
  
  // Validate taskerId
  if (!taskerId || taskerId.trim() === '') {
    console.error('❌ [ADMIN] Invalid tasker ID provided:', taskerId);
    throw new Error('Invalid tasker ID provided');
  }

  // First, let's check if the tasker exists
  const { data: existingTasker, error: checkError } = await supabase
    .from('users')
    .select('id, role, approved')
    .eq('id', taskerId)
    .single();

  if (checkError) {
    console.error('❌ [ADMIN] Error checking tasker existence:', checkError);
    throw new Error(`Failed to verify tasker exists: ${checkError.message}`);
  }

  if (!existingTasker) {
    console.error('❌ [ADMIN] Tasker not found with ID:', taskerId);
    throw new Error('Tasker not found');
  }

  console.log('📋 [ADMIN] Found tasker:', existingTasker);

  if (existingTasker.approved) {
    console.log('⚠️ [ADMIN] Tasker already approved:', taskerId);
    throw new Error('Tasker is already approved');
  }

  // Now update the tasker
  const { data, error, count } = await supabase
    .from('users')
    .update({ approved: true })
    .eq('id', taskerId)
    .select('*');

  console.log('📊 [ADMIN] Update result:', { data, error, count, affectedRows: data?.length });

  if (error) {
    console.error('❌ [ADMIN] Database error during tasker approval:', error);
    throw new Error(`Failed to approve tasker: ${error.message}`);
  }

  if (!data || data.length === 0) {
    console.error('❌ [ADMIN] No rows updated - tasker not found or already processed:', taskerId);
    throw new Error('No tasker was approved - tasker may not exist or already processed');
  }

  console.log('✅ [ADMIN] Tasker approved successfully:', data[0]);
  return data[0];
};

export const rejectTasker = async (taskerId: string) => {
  console.log('❌ [ADMIN] Rejecting tasker with ID:', taskerId);
  
  // Validate taskerId
  if (!taskerId || taskerId.trim() === '') {
    console.error('❌ [ADMIN] Invalid tasker ID provided:', taskerId);
    throw new Error('Invalid tasker ID provided');
  }

  // First, let's check if the tasker exists
  const { data: existingTasker, error: checkError } = await supabase
    .from('users')
    .select('id, role, approved')
    .eq('id', taskerId)
    .single();

  if (checkError) {
    console.error('❌ [ADMIN] Error checking tasker existence:', checkError);
    throw new Error(`Failed to verify tasker exists: ${checkError.message}`);
  }

  if (!existingTasker) {
    console.error('❌ [ADMIN] Tasker not found with ID:', taskerId);
    throw new Error('Tasker not found');
  }

  console.log('📋 [ADMIN] Found tasker for deletion:', existingTasker);

  // Now delete the tasker
  const { error, count } = await supabase
    .from('users')
    .delete()
    .eq('id', taskerId);

  console.log('📊 [ADMIN] Delete result:', { error, count });

  if (error) {
    console.error('❌ [ADMIN] Database error during tasker rejection:', error);
    throw new Error(`Failed to reject tasker: ${error.message}`);
  }

  console.log('✅ [ADMIN] Tasker rejected and deleted successfully');
  return true;
};
