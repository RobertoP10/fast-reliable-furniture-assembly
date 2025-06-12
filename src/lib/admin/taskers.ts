
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

    if (fetchError || !currentUser) {
      console.error('❌ [ADMIN] Error fetching user:', fetchError);
      throw new Error('User not found in database');
    }

    console.log('📋 [ADMIN] Found user before approval:', currentUser);

    // Check if user is a tasker
    if (currentUser.role !== 'tasker') {
      throw new Error(`User is not a tasker (role: ${currentUser.role})`);
    }

    // Check if already approved
    if (currentUser.approved) {
      throw new Error('Tasker is already approved');
    }

    // Now perform the approval update with simplified WHERE clause
    console.log('🔄 [ADMIN] Updating approval status for tasker:', taskerId);
    
    const { data: updatedData, error: updateError } = await supabase
      .from('users')
      .update({ approved: true })
      .eq('id', taskerId)
      .select('id, full_name, email, approved, role');

    if (updateError) {
      console.error('❌ [ADMIN] Database update error:', updateError);
      throw new Error(`Database update failed: ${updateError.message}`);
    }

    if (!updatedData || updatedData.length === 0) {
      console.error('❌ [ADMIN] No rows were updated for user:', taskerId);
      throw new Error('Failed to update user approval status');
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

  if (fetchError || !currentUser) {
    console.error('❌ [ADMIN] Error fetching user for rejection:', fetchError);
    throw new Error('User not found');
  }

  if (currentUser.role !== 'tasker') {
    throw new Error('User is not a tasker');
  }

  if (currentUser.approved) {
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
    throw new Error('Tasker not found or already processed');
  }

  console.log('✅ [ADMIN] Tasker account deleted successfully');
  return data;
};
