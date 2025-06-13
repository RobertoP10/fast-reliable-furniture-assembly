
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
  console.log('✅ [ADMIN] Starting tasker approval for ID:', taskerId);
  
  if (!taskerId || taskerId.trim() === '') {
    console.error('❌ [ADMIN] Invalid taskerId provided:', taskerId);
    throw new Error('Invalid tasker ID provided');
  }

  // First verify the tasker exists and is pending
  const { data: existingTasker, error: fetchError } = await supabase
    .from('users')
    .select('id, role, approved')
    .eq('id', taskerId)
    .eq('role', 'tasker')
    .eq('approved', false)
    .single();

  if (fetchError) {
    console.error('❌ [ADMIN] Error fetching tasker for verification:', fetchError);
    throw new Error(`Tasker not found or not in pending state: ${fetchError.message}`);
  }

  if (!existingTasker) {
    console.error('❌ [ADMIN] Tasker not found or not pending:', taskerId);
    throw new Error('Tasker not found or not in pending state');
  }

  console.log('✅ [ADMIN] Tasker verified, proceeding with approval:', existingTasker);

  // Now update the tasker
  const { data, error, count } = await supabase
    .from('users')
    .update({ approved: true })
    .eq('id', taskerId)
    .eq('role', 'tasker')
    .eq('approved', false)
    .select('*');

  if (error) {
    console.error('❌ [ADMIN] Database error during tasker approval:', error);
    throw new Error(`Failed to update tasker approval: ${error.message}`);
  }

  if (!data || data.length === 0) {
    console.error('❌ [ADMIN] No rows updated during approval. Count:', count);
    throw new Error('No tasker was updated - possibly already approved or not found');
  }

  const updatedTasker = data[0];
  console.log('✅ [ADMIN] Tasker approved successfully:', updatedTasker);
  
  // Verify the update was successful
  if (!updatedTasker.approved) {
    console.error('❌ [ADMIN] Approval flag not set correctly:', updatedTasker);
    throw new Error('Update completed but approval flag was not set');
  }

  return updatedTasker;
};

export const rejectTasker = async (taskerId: string) => {
  console.log('❌ [ADMIN] Starting tasker rejection for ID:', taskerId);
  
  if (!taskerId || taskerId.trim() === '') {
    console.error('❌ [ADMIN] Invalid taskerId provided:', taskerId);
    throw new Error('Invalid tasker ID provided');
  }

  // First verify the user exists and is a pending tasker
  const { data: existingUser, error: fetchError } = await supabase
    .from('users')
    .select('id, role, approved')
    .eq('id', taskerId)
    .eq('role', 'tasker')
    .eq('approved', false)
    .single();

  if (fetchError) {
    console.error('❌ [ADMIN] Error fetching tasker for verification:', fetchError);
    throw new Error(`Tasker not found or not in pending state: ${fetchError.message}`);
  }

  if (!existingUser) {
    console.error('❌ [ADMIN] Tasker not found or not pending:', taskerId);
    throw new Error('Tasker not found or not in pending state');
  }

  console.log('✅ [ADMIN] Tasker verified, proceeding with rejection:', existingUser);

  // Now delete the user
  const { error: deleteError, count } = await supabase
    .from('users')
    .delete()
    .eq('id', taskerId)
    .eq('role', 'tasker')
    .eq('approved', false);

  if (deleteError) {
    console.error('❌ [ADMIN] Database error during tasker rejection:', deleteError);
    throw new Error(`Failed to delete tasker: ${deleteError.message}`);
  }

  console.log('✅ [ADMIN] Tasker rejected and deleted successfully. Rows affected:', count);
  
  if (count === 0) {
    console.warn('⚠️ [ADMIN] No rows deleted - tasker may have already been processed');
    throw new Error('No tasker was deleted - possibly already processed');
  }

  return true;
};
