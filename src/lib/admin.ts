import { supabase } from "@/integrations/supabase/client";
import type { Database } from '@/integrations/supabase/types';

type User = Database['public']['Tables']['users']['Row'];
type Transaction = Database['public']['Tables']['transactions']['Row'];

// Fetch all users
export const fetchAllUsers = async (): Promise<User[]> => {
  console.log('🔍 [ADMIN] Fetching all users...');
  
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
};

// Fetch pending taskers
export const fetchPendingTaskers = async (): Promise<User[]> => {
  console.log('🔍 [ADMIN] Fetching pending taskers...');
  
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

  console.log('✅ [ADMIN] Pending taskers fetched successfully:', data?.length || 0, 'taskers');
  return data || [];
};

// Fetch pending transactions
export const fetchPendingTransactions = async (): Promise<Transaction[]> => {
  console.log('🔍 [ADMIN] Fetching pending transactions...');
  
  const { data, error } = await supabase
    .from('transactions')
    .select(`
      *,
      task:task_requests!transactions_task_id_fkey(title),
      client:users!transactions_client_id_fkey(full_name, email),
      tasker:users!transactions_tasker_id_fkey(full_name, email)
    `)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ [ADMIN] Error fetching pending transactions:', error);
    throw new Error(`Failed to fetch pending transactions: ${error.message}`);
  }

  console.log('✅ [ADMIN] Pending transactions fetched successfully:', data?.length || 0, 'transactions');
  return data || [];
};

// Accept tasker
export const acceptTasker = async (taskerId: string): Promise<void> => {
  console.log('📝 [ADMIN] Approving tasker:', taskerId);
  
  const { error } = await supabase
    .from('users')
    .update({ approved: true })
    .eq('id', taskerId);

  if (error) {
    console.error('❌ [ADMIN] Error approving tasker:', error);
    throw new Error(`Failed to approve tasker: ${error.message}`);
  }

  console.log('✅ [ADMIN] Tasker approved successfully');
};

// Reject tasker
export const rejectTasker = async (taskerId: string): Promise<void> => {
  console.log('📝 [ADMIN] Rejecting tasker:', taskerId);
  
  // For now, we'll just delete the user. In production, you might want to keep a record
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

// Confirm transaction
export const confirmTransaction = async (transactionId: string): Promise<void> => {
  console.log('📝 [ADMIN] Confirming transaction:', transactionId);
  
  const { data: { user } } = await supabase.auth.getUser();
  
  const { error } = await supabase
    .from('transactions')
    .update({ 
      status: 'confirmed',
      admin_confirmed_by: user?.id,
      admin_confirmed_at: new Date().toISOString()
    })
    .eq('id', transactionId);

  if (error) {
    console.error('❌ [ADMIN] Error confirming transaction:', error);
    throw new Error(`Failed to confirm transaction: ${error.message}`);
  }

  console.log('✅ [ADMIN] Transaction confirmed successfully');
};

// Get admin statistics
export const getAdminStats = async () => {
  console.log('🔍 [ADMIN] Fetching admin statistics...');
  
  // Get pending taskers count
  const { count: pendingTaskers } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'tasker')
    .eq('approved', false);

  // Get active users count (approved taskers + clients)
  const { count: activeUsers } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .or('role.eq.client,and(role.eq.tasker,approved.eq.true)');

  // Get total users count
  const { count: totalUsers } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true });

  // Get pending transactions count
  const { count: pendingTransactions } = await supabase
    .from('transactions')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending');

  console.log('✅ [ADMIN] Statistics fetched successfully');
  
  return {
    pendingTaskers: pendingTaskers || 0,
    activeUsers: activeUsers || 0,
    totalUsers: totalUsers || 0,
    pendingTransactions: pendingTransactions || 0
  };
};
