
import { supabase } from "@/integrations/supabase/client";
import type { Database } from '@/integrations/supabase/types';

type User = Database['public']['Tables']['users']['Row'];

// Admin functions - Fetch all users
export const fetchAllUsers = async (): Promise<User[]> => {
  console.log('🔍 [ADMIN] Fetching all users for admin');
  
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ [ADMIN] Error fetching users:', error);
      throw new Error(`Failed to fetch users: ${error.message}`);
    }

    console.log('✅ [ADMIN] Users fetched successfully:', data?.length || 0, 'users');
    return data || [];
  } catch (error) {
    console.error('❌ [ADMIN] Exception in fetchAllUsers:', error);
    throw error;
  }
};

export const fetchPendingTaskers = async (): Promise<User[]> => {
  console.log('🔍 [ADMIN] Fetching pending taskers for admin review');
  
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('role', 'tasker')
    .eq('approved', false)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ [ADMIN] Error fetching pending taskers:', error);
    throw new Error(`Failed to fetch pending taskers: ${error.message}`);
  }

  console.log('✅ [ADMIN] Pending taskers fetched successfully:', data?.length || 0, 'pending');
  return data || [];
};

export const fetchPendingTransactions = async () => {
  console.log('🔍 [ADMIN] Fetching pending transactions for admin');
  
  const { data, error } = await supabase
    .from('transactions')
    .select(`
      *,
      task:task_requests!transactions_task_id_fkey(title),
      client:users!transactions_client_id_fkey(full_name),
      tasker:users!transactions_tasker_id_fkey(full_name)
    `)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ [ADMIN] Error fetching transactions:', error);
    throw new Error(`Failed to fetch transactions: ${error.message}`);
  }

  console.log('✅ [ADMIN] Transactions fetched successfully:', data?.length || 0, 'transactions');
  return data || [];
};

// Accept a tasker
export const acceptTasker = async (taskerId: string): Promise<void> => {
  console.log('📝 [ADMIN] Accepting tasker:', taskerId);
  
  const { error } = await supabase
    .from('users')
    .update({ approved: true })
    .eq('id', taskerId);

  if (error) {
    console.error('❌ [ADMIN] Error accepting tasker:', error);
    throw new Error(`Failed to accept tasker: ${error.message}`);
  }

  console.log('✅ [ADMIN] Tasker accepted successfully');
};

// Reject a tasker
export const rejectTasker = async (taskerId: string): Promise<void> => {
  console.log('📝 [ADMIN] Rejecting tasker:', taskerId);
  
  const { error } = await supabase
    .from('users')
    .delete()
    .eq('id', taskerId);

  if (error) {
    console.error('❌ [ADMIN] Error rejecting tasker:', error);
    throw new Error(`Failed to reject tasker: ${error.message}`);
  }

  console.log('✅ [ADMIN] Tasker rejected successfully');
};
