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

// Fetch pending transactions with proper joins
export const fetchPendingTransactions = async () => {
  console.log('🔍 [ADMIN] Fetching pending transactions...');
  
  const { data, error } = await supabase
    .from('transactions')
    .select(`
      *,
      task_requests (
        id,
        title,
        status,
        completed_at
      ),
      client:users!transactions_client_id_fkey (
        id,
        full_name,
        email
      ),
      tasker:users!transactions_tasker_id_fkey (
        id,
        full_name,
        email
      )
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

// Fetch all transactions for analytics
export const fetchAllTransactions = async () => {
  console.log('🔍 [ADMIN] Fetching all transactions...');
  
  const { data, error } = await supabase
    .from('transactions')
    .select(`
      *,
      task_requests (
        id,
        title,
        status,
        completed_at
      ),
      client:users!transactions_client_id_fkey (
        id,
        full_name,
        email
      ),
      tasker:users!transactions_tasker_id_fkey (
        id,
        full_name,
        email
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ [ADMIN] Error fetching all transactions:', error);
    throw new Error(`Failed to fetch all transactions: ${error.message}`);
  }

  console.log('✅ [ADMIN] All transactions fetched successfully:', data?.length || 0, 'transactions');
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

// Get platform analytics
export const getPlatformAnalytics = async () => {
  console.log('🔍 [ADMIN] Fetching platform analytics...');
  
  // Get confirmed transactions with proper joins
  const { data: confirmedTransactions } = await supabase
    .from('transactions')
    .select(`
      *,
      task_requests!inner (
        id,
        title,
        status,
        completed_at
      ),
      client:users!transactions_client_id_fkey (
        id,
        full_name,
        email
      ),
      tasker:users!transactions_tasker_id_fkey (
        id,
        full_name,
        email
      )
    `)
    .eq('status', 'confirmed')
    .eq('task_requests.status', 'completed');

  // Get all reviews for average rating
  const { data: reviews } = await supabase
    .from('reviews')
    .select('rating, reviewee_id');

  // Get completed tasks count from confirmed transactions
  const totalCompletedTasks = confirmedTransactions?.length || 0;

  const totalValue = confirmedTransactions?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;
  const platformCommission = totalValue * 0.2; // 20% commission
  const averageRating = reviews && reviews.length > 0 
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
    : 0;

  // Group by tasker with enhanced data
  const taskerBreakdown = confirmedTransactions?.reduce((acc: any, transaction) => {
    const taskerId = transaction.tasker?.id;
    const taskerName = transaction.tasker?.full_name;
    
    if (taskerId && taskerName) {
      if (!acc[taskerId]) {
        acc[taskerId] = {
          id: taskerId,
          name: taskerName,
          taskCount: 0,
          totalEarnings: 0,
          totalCommission: 0,
          lastTaskDate: null,
          averageRating: 0
        };
      }
      acc[taskerId].taskCount += 1;
      acc[taskerId].totalEarnings += Number(transaction.amount);
      acc[taskerId].totalCommission += Number(transaction.amount) * 0.2;
      
      // Update last task date using task completion date
      const taskDate = transaction.task_requests?.completed_at;
      if (taskDate && (!acc[taskerId].lastTaskDate || new Date(taskDate) > new Date(acc[taskerId].lastTaskDate))) {
        acc[taskerId].lastTaskDate = taskDate;
      }
    }
    return acc;
  }, {}) || {};

  // Add average ratings for taskers
  if (reviews) {
    Object.keys(taskerBreakdown).forEach(taskerId => {
      const taskerReviews = reviews.filter(r => r.reviewee_id === taskerId);
      if (taskerReviews.length > 0) {
        taskerBreakdown[taskerId].averageRating = taskerReviews.reduce((sum, r) => sum + r.rating, 0) / taskerReviews.length;
      }
    });
  }

  // Group by client with enhanced data
  const clientBreakdown = confirmedTransactions?.reduce((acc: any, transaction) => {
    const clientId = transaction.client?.id;
    const clientName = transaction.client?.full_name;
    
    if (clientId && clientName) {
      if (!acc[clientId]) {
        acc[clientId] = {
          id: clientId,
          name: clientName,
          taskCount: 0,
          totalSpent: 0,
          totalCommission: 0,
          lastTaskDate: null,
          averageRating: 0
        };
      }
      acc[clientId].taskCount += 1;
      acc[clientId].totalSpent += Number(transaction.amount);
      acc[clientId].totalCommission += Number(transaction.amount) * 0.2;
      
      // Update last task date using task completion date
      const taskDate = transaction.task_requests?.completed_at;
      if (taskDate && (!acc[clientId].lastTaskDate || new Date(taskDate) > new Date(acc[clientId].lastTaskDate))) {
        acc[clientId].lastTaskDate = taskDate;
      }
    }
    return acc;
  }, {}) || {};

  // Add average ratings for clients
  if (reviews) {
    Object.keys(clientBreakdown).forEach(clientId => {
      const clientReviews = reviews.filter(r => r.reviewee_id === clientId);
      if (clientReviews.length > 0) {
        clientBreakdown[clientId].averageRating = clientReviews.reduce((sum, r) => sum + r.rating, 0) / clientReviews.length;
      }
    });
  }

  console.log('✅ [ADMIN] Platform analytics calculated successfully');
  
  return {
    totalCompletedTasks,
    totalValue,
    platformCommission,
    averageRating,
    taskerBreakdown: Object.values(taskerBreakdown),
    clientBreakdown: Object.values(clientBreakdown),
    // Add raw data for filtering
    confirmedTransactions: confirmedTransactions || []
  };
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

// Filter transactions by date range
export const fetchTransactionsByDateRange = async (startDate: string, endDate: string) => {
  console.log('🔍 [ADMIN] Fetching transactions by date range:', startDate, 'to', endDate);
  
  const { data, error } = await supabase
    .from('transactions')
    .select(`
      *,
      task_requests (
        id,
        title,
        status,
        completed_at
      ),
      client:users!transactions_client_id_fkey (
        id,
        full_name,
        email
      ),
      tasker:users!transactions_tasker_id_fkey (
        id,
        full_name,
        email
      )
    `)
    .gte('created_at', startDate)
    .lte('created_at', endDate)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ [ADMIN] Error fetching transactions by date:', error);
    throw new Error(`Failed to fetch transactions: ${error.message}`);
  }

  return data || [];
};

// Filter transactions by tasker
export const fetchTransactionsByTasker = async (taskerId: string) => {
  console.log('🔍 [ADMIN] Fetching transactions by tasker:', taskerId);
  
  const { data, error } = await supabase
    .from('transactions')
    .select(`
      *,
      task_requests (
        id,
        title,
        status,
        completed_at
      ),
      client:users!transactions_client_id_fkey (
        id,
        full_name,
        email
      ),
      tasker:users!transactions_tasker_id_fkey (
        id,
        full_name,
        email
      )
    `)
    .eq('tasker_id', taskerId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ [ADMIN] Error fetching transactions by tasker:', error);
    throw new Error(`Failed to fetch transactions: ${error.message}`);
  }

  return data || [];
};

// Filter transactions by client
export const fetchTransactionsByClient = async (clientId: string) => {
  console.log('🔍 [ADMIN] Fetching transactions by client:', clientId);
  
  const { data, error } = await supabase
    .from('transactions')
    .select(`
      *,
      task_requests (
        id,
        title,
        status,
        completed_at
      ),
      client:users!transactions_client_id_fkey (
        id,
        full_name,
        email
      ),
      tasker:users!transactions_tasker_id_fkey (
        id,
        full_name,
        email
      )
    `)
    .eq('client_id', clientId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ [ADMIN] Error fetching transactions by client:', error);
    throw new Error(`Failed to fetch transactions: ${error.message}`);
  }

  return data || [];
};
