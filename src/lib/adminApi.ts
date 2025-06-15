
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
  console.log('🔄 [ADMIN] Starting approval process for taskerId:', taskerId);
  
  // Validate taskerId
  if (!taskerId || typeof taskerId !== 'string' || taskerId.trim() === '') {
    throw new Error('Invalid tasker ID provided');
  }

  const trimmedId = taskerId.trim();
  console.log('📋 [ADMIN] Trimmed taskerId:', trimmedId);

  try {
    // First, check if the tasker exists and is pending
    const { data: existingTasker, error: checkError } = await supabase
      .from('users')
      .select('id, role, approved, full_name')
      .eq('id', trimmedId)
      .single();

    console.log('🔍 [ADMIN] Existing tasker check:', existingTasker);
    console.log('🔍 [ADMIN] Check error:', checkError);

    if (checkError) {
      console.error('❌ [ADMIN] Error checking tasker:', checkError);
      throw new Error('Failed to verify tasker exists');
    }

    if (!existingTasker) {
      throw new Error('Tasker not found in database');
    }

    if (existingTasker.role !== 'tasker') {
      throw new Error('User is not a tasker');
    }

    if (existingTasker.approved === true) {
      throw new Error('Tasker is already approved');
    }

    // Now perform the update
    console.log('🔄 [ADMIN] Performing approval update...');
    const { data, error } = await supabase
      .from('users')
      .update({ approved: true })
      .eq('id', trimmedId)
      .select('*');

    console.log('📊 [ADMIN] Update result:', { data, error });

    if (error) {
      console.error('❌ [ADMIN] Update error:', error);
      throw new Error(`Database error: ${error.message}`);
    }

    if (!data || data.length === 0) {
      throw new Error('Update operation returned no data');
    }

    console.log('✅ [ADMIN] Tasker approved successfully:', data[0]);
    return data[0];

  } catch (error) {
    console.error('❌ [ADMIN] Exception during approval:', error);
    throw error;
  }
};

export const rejectTasker = async (taskerId: string) => {
  console.log('🔄 [ADMIN] Starting rejection process for taskerId:', taskerId);
  
  // Validate taskerId
  if (!taskerId || typeof taskerId !== 'string' || taskerId.trim() === '') {
    throw new Error('Invalid tasker ID provided');
  }

  const trimmedId = taskerId.trim();
  console.log('📋 [ADMIN] Trimmed taskerId:', trimmedId);

  try {
    // First, check if the tasker exists
    const { data: existingTasker, error: checkError } = await supabase
      .from('users')
      .select('id, role, approved, full_name')
      .eq('id', trimmedId)
      .single();

    console.log('🔍 [ADMIN] Existing tasker check:', existingTasker);
    console.log('🔍 [ADMIN] Check error:', checkError);

    if (checkError) {
      console.error('❌ [ADMIN] Error checking tasker:', checkError);
      throw new Error('Failed to verify tasker exists');
    }

    if (!existingTasker) {
      throw new Error('Tasker not found in database');
    }

    if (existingTasker.role !== 'tasker') {
      throw new Error('User is not a tasker');
    }

    // Now perform the deletion
    console.log('🔄 [ADMIN] Performing rejection deletion...');
    const { data, error } = await supabase
      .from('users')
      .delete()
      .eq('id', trimmedId)
      .select('*');

    console.log('📊 [ADMIN] Delete result:', { data, error });

    if (error) {
      console.error('❌ [ADMIN] Delete error:', error);
      throw new Error(`Database error: ${error.message}`);
    }

    if (!data || data.length === 0) {
      throw new Error('Delete operation returned no data');
    }

    console.log('✅ [ADMIN] Tasker deleted successfully:', data[0]);
    return true;

  } catch (error) {
    console.error('❌ [ADMIN] Exception during rejection:', error);
    throw error;
  }
};
