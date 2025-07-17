import { supabase } from "@/integrations/supabase/client";
import type { User, PendingTasker } from "./types";

export const fetchAllUsers = async (): Promise<User[]> => {
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

export const fetchPendingTaskers = async (): Promise<PendingTasker[]> => {
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

export const acceptTasker = async (taskerId: string) => {
  console.log('🔄 [ADMIN] Starting approval process for taskerId:', taskerId);
  
  if (!taskerId || typeof taskerId !== 'string' || taskerId.trim() === '') {
    throw new Error('Invalid tasker ID provided');
  }

  const trimmedId = taskerId.trim();
  console.log('📋 [ADMIN] Processing taskerId:', trimmedId);

  try {
    // First, check current user's admin status
    console.log('🔍 [ADMIN] Checking current user admin status...');
    const { data: currentUser, error: currentUserError } = await supabase.auth.getUser();
    
    if (currentUserError) {
      console.error('❌ [ADMIN] Current user error:', currentUserError);
      throw new Error('Authentication failed - please log in again');
    }

    console.log('👤 [ADMIN] Current user ID:', currentUser.user?.id);

    // Check if current user is admin
    const { data: adminCheck, error: adminError } = await supabase
      .from('users')
      .select('role, approved')
      .eq('id', currentUser.user?.id)
      .single();

    console.log('🔍 [ADMIN] Admin check result:', { data: adminCheck, error: adminError });

    if (adminError || !adminCheck || adminCheck.role !== 'admin') {
      throw new Error('Unauthorized - admin access required');
    }

    // Now verify the target user exists and is a pending tasker
    console.log('🔍 [ADMIN] Checking target user exists and is pending...');
    const { data: userCheck, error: userCheckError } = await supabase
      .from('users')
      .select('id, role, approved, full_name, email')
      .eq('id', trimmedId)
      .single();

    console.log('🔍 [ADMIN] User check result:', { 
      data: userCheck, 
      error: userCheckError
    });

    if (userCheckError) {
      console.error('❌ [ADMIN] Error checking user exists:', userCheckError);
      throw new Error(`User not found: ${userCheckError.message}`);
    }

    if (!userCheck) {
      throw new Error('User not found in database');
    }

    if (userCheck.role !== 'tasker') {
      throw new Error(`User is not a tasker (current role: ${userCheck.role})`);
    }

    if (userCheck.approved === true) {
      throw new Error('Tasker is already approved');
    }

    // Perform the approval update with comprehensive WHERE clause for safety
    console.log('🔄 [ADMIN] Performing approval update...');
    const { data: updateData, error: updateError } = await supabase
      .from('users')
      .update({ approved: true })
      .eq('id', trimmedId)
      .eq('role', 'tasker')
      .eq('approved', false)
      .select('*');

    console.log('📊 [ADMIN] Update result:', { 
      data: updateData, 
      error: updateError,
      dataLength: updateData?.length 
    });

    if (updateError) {
      console.error('❌ [ADMIN] Update error:', updateError);
      throw new Error(`Failed to approve tasker: ${updateError.message}`);
    }

    if (!updateData || updateData.length === 0) {
      // More specific error based on what we found
      throw new Error('Update failed - the tasker may have been modified by another admin or no longer exists');
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
  
  if (!taskerId || typeof taskerId !== 'string' || taskerId.trim() === '') {
    throw new Error('Invalid tasker ID provided');
  }

  const trimmedId = taskerId.trim();
  console.log('📋 [ADMIN] Processing taskerId:', trimmedId);

  try {
    // First, check current user's admin status
    console.log('🔍 [ADMIN] Checking current user admin status...');
    const { data: currentUser, error: currentUserError } = await supabase.auth.getUser();
    
    if (currentUserError) {
      console.error('❌ [ADMIN] Current user error:', currentUserError);
      throw new Error('Authentication failed - please log in again');
    }

    console.log('👤 [ADMIN] Current user ID:', currentUser.user?.id);

    // Check if current user is admin
    const { data: adminCheck, error: adminError } = await supabase
      .from('users')
      .select('role, approved')
      .eq('id', currentUser.user?.id)
      .single();

    console.log('🔍 [ADMIN] Admin check result:', { data: adminCheck, error: adminError });

    if (adminError || !adminCheck || adminCheck.role !== 'admin') {
      throw new Error('Unauthorized - admin access required');
    }

    // Now verify the target user exists and is a pending tasker
    console.log('🔍 [ADMIN] Checking target user exists and is pending...');
    const { data: userCheck, error: userCheckError } = await supabase
      .from('users')
      .select('id, role, approved, full_name, email')
      .eq('id', trimmedId)
      .single();

    console.log('🔍 [ADMIN] User check result:', { 
      data: userCheck, 
      error: userCheckError
    });

    if (userCheckError) {
      console.error('❌ [ADMIN] Error checking user exists:', userCheckError);
      throw new Error(`User not found: ${userCheckError.message}`);
    }

    if (!userCheck) {
      throw new Error('User not found in database');
    }

    if (userCheck.role !== 'tasker') {
      throw new Error(`User is not a tasker (current role: ${userCheck.role})`);
    }

    // Perform the rejection deletion with comprehensive WHERE clause for safety
    console.log('🔄 [ADMIN] Performing rejection deletion...');
    const { data: deleteData, error: deleteError } = await supabase
      .from('users')
      .delete()
      .eq('id', trimmedId)
      .eq('role', 'tasker')
      .eq('approved', false)
      .select('*');

    console.log('📊 [ADMIN] Delete result:', { 
      data: deleteData, 
      error: deleteError,
      dataLength: deleteData?.length 
    });

    if (deleteError) {
      console.error('❌ [ADMIN] Delete error:', deleteError);
      throw new Error(`Failed to reject tasker: ${deleteError.message}`);
    }

    if (!deleteData || deleteData.length === 0) {
      // More specific error based on what we found
      throw new Error('Delete failed - the tasker may have been modified by another admin or no longer exists');
    }

    console.log('✅ [ADMIN] Tasker deleted successfully:', deleteData[0]);
    return true;

  } catch (error) {
    console.error('❌ [ADMIN] Exception during rejection:', error);
    throw error;
  }
};

export const updateUserEmailPreferences = async (userId: string, emailEnabled: boolean) => {
  console.log('🔄 Updating email preferences for user:', userId, 'enabled:', emailEnabled);
  
  const { data, error } = await supabase
    .from('users')
    .update({ email_notifications_enabled: emailEnabled })
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    console.error('❌ Error updating email preferences:', error);
    throw error;
  }

  console.log('✅ Email preferences updated successfully:', data);
  return data;
};
