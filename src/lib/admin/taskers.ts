
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
    // First, check if the user exists and is pending
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id, full_name, email, role, approved')
      .eq('id', taskerId)
      .single();

    if (checkError) {
      console.error('❌ [ADMIN] Error checking user:', checkError);
      throw new Error(`Failed to check user: ${checkError.message}`);
    }

    if (!existingUser) {
      throw new Error('User not found');
    }

    if (existingUser.role !== 'tasker') {
      throw new Error('User is not a tasker');
    }

    if (existingUser.approved === true) {
      throw new Error('User is already approved');
    }

    console.log('🔍 [ADMIN] User found, proceeding with approval:', existingUser);

    // Update the user to approved
    const { data, error } = await supabase
      .from('users')
      .update({ approved: true })
      .eq('id', taskerId)
      .select('id, full_name, email, approved, role');

    if (error) {
      console.error('❌ [ADMIN] Database error during approval:', error);
      throw new Error(`Database error: ${error.message}`);
    }

    if (!data || data.length === 0) {
      throw new Error('Failed to update user approval status');
    }

    console.log('✅ [ADMIN] Tasker approved successfully:', data[0]);
    return data[0];

  } catch (error) {
    console.error('❌ [ADMIN] Approval failed:', error);
    throw error;
  }
};

export const acceptTasker = approveTasker; // Alias for compatibility

export const rejectTasker = async (taskerId: string) => {
  console.log('❌ [ADMIN] Starting tasker rejection for ID:', taskerId);
  
  try {
    // First, check if the user exists and is pending
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id, full_name, email, role, approved')
      .eq('id', taskerId)
      .single();

    if (checkError) {
      console.error('❌ [ADMIN] Error checking user:', checkError);
      throw new Error(`Failed to check user: ${checkError.message}`);
    }

    if (!existingUser) {
      throw new Error('User not found');
    }

    if (existingUser.role !== 'tasker') {
      throw new Error('User is not a tasker');
    }

    if (existingUser.approved === true) {
      throw new Error('User is already approved, cannot reject');
    }

    console.log('🔍 [ADMIN] User found, proceeding with rejection:', existingUser);

    // Delete the user
    const { data, error } = await supabase
      .from('users')
      .delete()
      .eq('id', taskerId)
      .select('id, full_name, email');

    if (error) {
      console.error('❌ [ADMIN] Database error during rejection:', error);
      throw new Error(`Database error: ${error.message}`);
    }

    if (!data || data.length === 0) {
      throw new Error('Failed to delete user');
    }

    console.log('✅ [ADMIN] Tasker rejected and deleted successfully:', data[0]);
    return data[0];

  } catch (error) {
    console.error('❌ [ADMIN] Rejection failed:', error);
    throw error;
  }
};
