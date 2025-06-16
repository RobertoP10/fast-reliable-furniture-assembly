
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
    console.log('🔍 [ADMIN] Checking if user exists...');
    const { data: userCheck, error: userCheckError } = await supabase
      .from('users')
      .select('id, role, approved, full_name, email')
      .eq('id', trimmedId);

    console.log('🔍 [ADMIN] User check result:', { 
      data: userCheck, 
      error: userCheckError,
      count: userCheck?.length 
    });

    if (userCheckError) {
      console.error('❌ [ADMIN] Error checking user exists:', userCheckError);
      throw new Error(`Database error: ${userCheckError.message}`);
    }

    if (!userCheck || userCheck.length === 0) {
      throw new Error('User not found in database');
    }

    const user = userCheck[0];
    console.log('👤 [ADMIN] Found user:', user);

    if (user.role !== 'tasker') {
      throw new Error(`User is not a tasker (current role: ${user.role})`);
    }

    if (user.approved === true) {
      throw new Error('Tasker is already approved');
    }

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
      throw new Error(`Failed to approve tasker: ${updateError.message}`);
    }

    if (!updateData || updateData.length === 0) {
      const { data: finalCheck } = await supabase
        .from('users')
        .select('id, role, approved')
        .eq('id', trimmedId)
        .single();
      
      console.log('🔍 [ADMIN] Final state check:', finalCheck);
      
      if (finalCheck?.approved === true) {
        console.log('✅ [ADMIN] User was approved (possibly by another process)');
        return finalCheck;
      }
      
      throw new Error('Update failed - user may have been deleted or database connection issue');
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
    console.log('🔍 [ADMIN] Checking if user exists...');
    const { data: userCheck, error: userCheckError } = await supabase
      .from('users')
      .select('id, role, approved, full_name, email')
      .eq('id', trimmedId);

    console.log('🔍 [ADMIN] User check result:', { 
      data: userCheck, 
      error: userCheckError,
      count: userCheck?.length 
    });

    if (userCheckError) {
      console.error('❌ [ADMIN] Error checking user exists:', userCheckError);
      throw new Error(`Database error: ${userCheckError.message}`);
    }

    if (!userCheck || userCheck.length === 0) {
      throw new Error('User not found in database');
    }

    const user = userCheck[0];
    console.log('👤 [ADMIN] Found user:', user);

    if (user.role !== 'tasker') {
      throw new Error(`User is not a tasker (current role: ${user.role})`);
    }

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
      throw new Error(`Failed to reject tasker: ${deleteError.message}`);
    }

    if (!deleteData || deleteData.length === 0) {
      const { data: finalCheck } = await supabase
        .from('users')
        .select('id')
        .eq('id', trimmedId)
        .single();
      
      console.log('🔍 [ADMIN] User exists after delete attempt:', !!finalCheck);
      
      if (!finalCheck) {
        console.log('✅ [ADMIN] User was deleted (possibly by another process)');
        return true;
      }
      
      throw new Error('Delete failed - database connection issue or constraints preventing deletion');
    }

    console.log('✅ [ADMIN] Tasker deleted successfully:', deleteData[0]);
    return true;

  } catch (error) {
    console.error('❌ [ADMIN] Exception during rejection:', error);
    throw error;
  }
};
