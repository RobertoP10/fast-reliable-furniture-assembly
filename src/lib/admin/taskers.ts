
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
    // Simple approval - just update the approved field
    const { data, error } = await supabase
      .from('users')
      .update({ approved: true })
      .eq('id', taskerId)
      .eq('role', 'tasker')
      .eq('approved', false)
      .select('id, full_name, email, approved, role');

    if (error) {
      console.error('❌ [ADMIN] Database error during approval:', error);
      throw new Error(`Database error: ${error.message}`);
    }

    if (!data || data.length === 0) {
      console.error('❌ [ADMIN] No rows updated - user may not exist or already approved');
      throw new Error('User not found or already approved');
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
    // Simple rejection - just delete the user
    const { data, error } = await supabase
      .from('users')
      .delete()
      .eq('id', taskerId)
      .eq('role', 'tasker')
      .eq('approved', false)
      .select('id, full_name, email');

    if (error) {
      console.error('❌ [ADMIN] Database error during rejection:', error);
      throw new Error(`Database error: ${error.message}`);
    }

    if (!data || data.length === 0) {
      console.error('❌ [ADMIN] No rows deleted - user may not exist or already processed');
      throw new Error('User not found or already processed');
    }

    console.log('✅ [ADMIN] Tasker rejected and deleted successfully:', data[0]);
    return data[0];

  } catch (error) {
    console.error('❌ [ADMIN] Rejection failed:', error);
    throw error;
  }
};
