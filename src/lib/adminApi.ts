
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
  console.log('🔄 [ADMIN] Starting approval process...');
  console.log('📋 [ADMIN] TaskerId:', taskerId);
  console.log('📋 [ADMIN] TaskerId type:', typeof taskerId);
  console.log('📋 [ADMIN] TaskerId length:', taskerId?.length);
  
  // Validate taskerId
  if (!taskerId || typeof taskerId !== 'string' || taskerId.trim() === '') {
    const error = 'Invalid tasker ID provided';
    console.error('❌ [ADMIN]', error, '- received:', taskerId);
    throw new Error(error);
  }

  const trimmedId = taskerId.trim();
  console.log('📋 [ADMIN] Trimmed taskerId:', trimmedId);

  try {
    // Execute the update
    console.log('🔄 [ADMIN] Executing UPDATE query...');
    const { data, error, count } = await supabase
      .from('users')
      .update({ approved: true })
      .eq('id', trimmedId)
      .select('*');

    console.log('📊 [ADMIN] Raw Supabase response:');
    console.log('  - data:', data);
    console.log('  - error:', error);
    console.log('  - count:', count);
    console.log('  - data length:', data?.length);

    if (error) {
      console.error('❌ [ADMIN] Supabase error:', error);
      throw new Error(`Database error: ${error.message}`);
    }

    if (!data || data.length === 0) {
      console.error('❌ [ADMIN] No rows were updated');
      console.error('❌ [ADMIN] This could mean:');
      console.error('  1. Tasker ID does not exist in database');
      console.error('  2. Tasker is already approved');
      console.error('  3. Row-level security is blocking the update');
      throw new Error('No tasker was approved - tasker may not exist or already approved');
    }

    console.log('✅ [ADMIN] Tasker approved successfully:', data[0]);
    return data[0];

  } catch (error) {
    console.error('❌ [ADMIN] Exception during approval:', error);
    throw error;
  }
};

export const rejectTasker = async (taskerId: string) => {
  console.log('🔄 [ADMIN] Starting rejection process...');
  console.log('📋 [ADMIN] TaskerId:', taskerId);
  console.log('📋 [ADMIN] TaskerId type:', typeof taskerId);
  console.log('📋 [ADMIN] TaskerId length:', taskerId?.length);
  
  // Validate taskerId
  if (!taskerId || typeof taskerId !== 'string' || taskerId.trim() === '') {
    const error = 'Invalid tasker ID provided';
    console.error('❌ [ADMIN]', error, '- received:', taskerId);
    throw new Error(error);
  }

  const trimmedId = taskerId.trim();
  console.log('📋 [ADMIN] Trimmed taskerId:', trimmedId);

  try {
    // Execute the delete
    console.log('🔄 [ADMIN] Executing DELETE query...');
    const { data, error, count } = await supabase
      .from('users')
      .delete()
      .eq('id', trimmedId)
      .select('*');

    console.log('📊 [ADMIN] Raw Supabase response:');
    console.log('  - data:', data);
    console.log('  - error:', error);
    console.log('  - count:', count);
    console.log('  - data length:', data?.length);

    if (error) {
      console.error('❌ [ADMIN] Supabase error:', error);
      throw new Error(`Database error: ${error.message}`);
    }

    if (!data || data.length === 0) {
      console.error('❌ [ADMIN] No rows were deleted');
      console.error('❌ [ADMIN] This could mean:');
      console.error('  1. Tasker ID does not exist in database');
      console.error('  2. Row-level security is blocking the delete');
      throw new Error('No tasker was deleted - tasker may not exist');
    }

    console.log('✅ [ADMIN] Tasker deleted successfully:', data[0]);
    return true;

  } catch (error) {
    console.error('❌ [ADMIN] Exception during rejection:', error);
    throw error;
  }
};
