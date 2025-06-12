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
  console.log('✅ [ADMIN] Starting tasker approval for ID:', taskerId);
  
  try {
    // First, verify the user exists and get their current state
    const { data: currentUser, error: fetchError } = await supabase
      .from('users')
      .select('id, role, approved, email, full_name')
      .eq('id', taskerId)
      .single();

    if (fetchError) {
      console.error('❌ [ADMIN] Error fetching user before approval:', fetchError);
      throw new Error(`User lookup failed: ${fetchError.message}`);
    }

    if (!currentUser) {
      console.error('❌ [ADMIN] User not found with ID:', taskerId);
      throw new Error('User not found in database');
    }

    console.log('📋 [ADMIN] Found user before approval:', currentUser);

    // Check if user is a tasker
    if (currentUser.role !== 'tasker') {
      console.error('❌ [ADMIN] User is not a tasker, role is:', currentUser.role);
      throw new Error(`User is not a tasker (role: ${currentUser.role})`);
    }

    // Check if already approved
    if (currentUser.approved) {
      console.error('❌ [ADMIN] Tasker already approved');
      throw new Error('Tasker is already approved');
    }

    // Now perform the approval update
    console.log('🔄 [ADMIN] Updating approval status for tasker:', taskerId);
    
    const { data: updatedData, error: updateError } = await supabase
      .from('users')
      .update({ approved: true })
      .eq('id', taskerId)
      .eq('role', 'tasker')
      .eq('approved', false)
      .select('id, full_name, email, approved, role');

    if (updateError) {
      console.error('❌ [ADMIN] Database update error:', updateError);
      throw new Error(`Database update failed: ${updateError.message}`);
    }

    if (!updatedData || updatedData.length === 0) {
      console.error('❌ [ADMIN] No rows were updated. This could mean:');
      console.error('  - User ID does not exist:', taskerId);
      console.error('  - User is not a tasker');
      console.error('  - User is already approved');
      console.error('  - User was modified by another process');
      
      // Let's do one more check to see the current state
      const { data: finalCheck } = await supabase
        .from('users')
        .select('id, role, approved')
        .eq('id', taskerId)
        .single();
      
      console.error('❌ [ADMIN] Current user state after failed update:', finalCheck);
      throw new Error('No rows were updated - user may have been modified or does not meet approval criteria');
    }

    console.log('✅ [ADMIN] Tasker approved successfully:', updatedData[0]);
    return updatedData[0];

  } catch (error) {
    console.error('❌ [ADMIN] Approval process failed:', error);
    throw error;
  }
};

export const acceptTasker = approveTasker; // Alias for compatibility

export const rejectTasker = async (taskerId: string) => {
  console.log('❌ [ADMIN] Rejecting tasker:', taskerId);
  
  // First verify the user exists and is a pending tasker
  const { data: currentUser, error: fetchError } = await supabase
    .from('users')
    .select('id, role, approved')
    .eq('id', taskerId)
    .single();

  if (fetchError) {
    console.error('❌ [ADMIN] Error fetching user for rejection:', fetchError);
    throw new Error(`User not found: ${fetchError.message}`);
  }

  if (!currentUser) {
    console.error('❌ [ADMIN] User not found for rejection:', taskerId);
    throw new Error('User not found');
  }

  if (currentUser.role !== 'tasker') {
    console.error('❌ [ADMIN] User is not a tasker:', currentUser.role);
    throw new Error('User is not a tasker');
  }

  if (currentUser.approved) {
    console.error('❌ [ADMIN] Cannot reject approved tasker:', taskerId);
    throw new Error('Cannot reject an already approved tasker');
  }

  // Delete the tasker account entirely for rejection
  const { data, error } = await supabase
    .from('users')
    .delete()
    .eq('id', taskerId)
    .select();

  if (error) {
    console.error('❌ [ADMIN] Error rejecting tasker:', error);
    throw new Error(`Failed to reject tasker: ${error.message}`);
  }

  if (!data || data.length === 0) {
    console.error('❌ [ADMIN] No tasker found to reject:', taskerId);
    throw new Error('Tasker not found or already processed');
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

// New functions for pending client tasks
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
