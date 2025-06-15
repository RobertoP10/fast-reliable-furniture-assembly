
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
    // First, verify the tasker exists and get their current state
    console.log('🔍 [ADMIN] Checking tasker exists...');
    const { data: existingTasker, error: checkError } = await supabase
      .from('users')
      .select('id, role, approved, full_name, email')
      .eq('id', trimmedId)
      .single();

    console.log('🔍 [ADMIN] Existing tasker data:', existingTasker);

    if (checkError) {
      console.error('❌ [ADMIN] Error checking tasker:', checkError);
      throw new Error(`Failed to find tasker: ${checkError.message}`);
    }

    if (!existingTasker) {
      throw new Error('Tasker not found in database');
    }

    if (existingTasker.role !== 'tasker') {
      throw new Error(`User is not a tasker (role: ${existingTasker.role})`);
    }

    if (existingTasker.approved === true) {
      throw new Error('Tasker is already approved');
    }

    // Now perform the update with just the ID - simplified query
    console.log('🔄 [ADMIN] Performing approval update...');
    const { data: updateData, error: updateError } = await supabase
      .from('users')
      .update({ approved: true })
      .eq('id', trimmedId)
      .select('*');

    console.log('📊 [ADMIN] Update result:', { 
      data: updateData, 
      error: updateError,
      dataLength: updateData?.length 
    });

    if (updateError) {
      console.error('❌ [ADMIN] Update error:', updateError);
      throw new Error(`Database update failed: ${updateError.message}`);
    }

    if (!updateData || updateData.length === 0) {
      throw new Error('Update operation failed - no rows were affected. Tasker may have been deleted.');
    }

    console.log('✅ [ADMIN] Tasker approved successfully:', updateData[0]);
    return updateData[0];

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
    // First, verify the tasker exists
    console.log('🔍 [ADMIN] Checking tasker exists...');
    const { data: existingTasker, error: checkError } = await supabase
      .from('users')
      .select('id, role, approved, full_name, email')
      .eq('id', trimmedId)
      .single();

    console.log('🔍 [ADMIN] Existing tasker data:', existingTasker);

    if (checkError) {
      console.error('❌ [ADMIN] Error checking tasker:', checkError);
      throw new Error(`Failed to find tasker: ${checkError.message}`);
    }

    if (!existingTasker) {
      throw new Error('Tasker not found in database');
    }

    if (existingTasker.role !== 'tasker') {
      throw new Error(`User is not a tasker (role: ${existingTasker.role})`);
    }

    // Now perform the deletion with just the ID
    console.log('🔄 [ADMIN] Performing rejection deletion...');
    const { data: deleteData, error: deleteError } = await supabase
      .from('users')
      .delete()
      .eq('id', trimmedId)
      .select('*');

    console.log('📊 [ADMIN] Delete result:', { 
      data: deleteData, 
      error: deleteError,
      dataLength: deleteData?.length 
    });

    if (deleteError) {
      console.error('❌ [ADMIN] Delete error:', deleteError);
      throw new Error(`Database delete failed: ${deleteError.message}`);
    }

    if (!deleteData || deleteData.length === 0) {
      throw new Error('Delete operation failed - no rows were affected. Tasker may have already been deleted.');
    }

    console.log('✅ [ADMIN] Tasker deleted successfully:', deleteData[0]);
    return true;

  } catch (error) {
    console.error('❌ [ADMIN] Exception during rejection:', error);
    throw error;
  }
};
