
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
  console.log('✅ [ADMIN] Approving tasker:', taskerId);
  
  const { data, error } = await supabase
    .from('users')
    .update({ approved: true })
    .eq('id', taskerId)
    .select();

  if (error) {
    console.error('❌ [ADMIN] Error approving tasker:', error);
    throw error;
  }

  console.log('✅ [ADMIN] Tasker approved successfully:', data);
  return data;
};

export const acceptTasker = approveTasker; // Alias for compatibility

export const rejectTasker = async (taskerId: string) => {
  console.log('❌ [ADMIN] Rejecting tasker:', taskerId);
  
  // For now, we'll just delete the user. In a production app, 
  // you might want to set a 'rejected' status instead
  const { data, error } = await supabase
    .from('users')
    .delete()
    .eq('id', taskerId);

  if (error) {
    console.error('❌ [ADMIN] Error rejecting tasker:', error);
    throw error;
  }

  console.log('✅ [ADMIN] Tasker rejected successfully');
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

export const fetchPendingTransactions = async () => {
  console.log('🔍 [ADMIN] Fetching pending transactions...');
  
  const { data, error } = await supabase
    .from('transactions')
    .select(`
      *,
      client:users!transactions_client_id_fkey(
        full_name,
        email
      ),
      tasker:users!transactions_tasker_id_fkey(
        full_name,
        email
      ),
      task_requests!transactions_task_id_fkey(
        title,
        completed_at
      )
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

export const confirmTransaction = async (transactionId: string) => {
  console.log('✅ [ADMIN] Confirming transaction:', transactionId);
  
  const { data, error } = await supabase
    .from('transactions')
    .update({ 
      status: 'paid',
      admin_confirmed_at: new Date().toISOString()
    })
    .eq('id', transactionId)
    .select();

  if (error) {
    console.error('❌ [ADMIN] Error confirming transaction:', error);
    throw error;
  }

  console.log('✅ [ADMIN] Transaction confirmed successfully:', data);
  return data;
};

export const fetchAllTransactions = async () => {
  console.log('🔍 [ADMIN] Fetching all transactions...');
  
  const { data, error } = await supabase
    .from('transactions')
    .select(`
      *,
      client:users!transactions_client_id_fkey(
        full_name,
        email
      ),
      tasker:users!transactions_tasker_id_fkey(
        full_name,
        email
      ),
      task_requests!transactions_task_id_fkey(
        title
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ [ADMIN] Error fetching all transactions:', error);
    throw error;
  }

  console.log('✅ [ADMIN] Fetched all transactions:', data?.length || 0);
  return data || [];
};

export const fetchTransactionsByDateRange = async (startDate: string, endDate: string) => {
  console.log('🔍 [ADMIN] Fetching transactions by date range:', startDate, endDate);
  
  const { data, error } = await supabase
    .from('transactions')
    .select(`
      *,
      client:users!transactions_client_id_fkey(
        full_name,
        email
      ),
      tasker:users!transactions_tasker_id_fkey(
        full_name,
        email
      ),
      task_requests!transactions_task_id_fkey(
        title
      )
    `)
    .gte('created_at', startDate)
    .lte('created_at', endDate)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ [ADMIN] Error fetching transactions by date range:', error);
    throw error;
  }

  console.log('✅ [ADMIN] Fetched transactions by date range:', data?.length || 0);
  return data || [];
};

export const fetchTransactionsByTasker = async (taskerId: string) => {
  console.log('🔍 [ADMIN] Fetching transactions by tasker:', taskerId);
  
  const { data, error } = await supabase
    .from('transactions')
    .select(`
      *,
      client:users!transactions_client_id_fkey(
        full_name,
        email
      ),
      tasker:users!transactions_tasker_id_fkey(
        full_name,
        email
      ),
      task_requests!transactions_task_id_fkey(
        title
      )
    `)
    .eq('tasker_id', taskerId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ [ADMIN] Error fetching transactions by tasker:', error);
    throw error;
  }

  console.log('✅ [ADMIN] Fetched transactions by tasker:', data?.length || 0);
  return data || [];
};

export const fetchTransactionsByClient = async (clientId: string) => {
  console.log('🔍 [ADMIN] Fetching transactions by client:', clientId);
  
  const { data, error } = await supabase
    .from('transactions')
    .select(`
      *,
      client:users!transactions_client_id_fkey(
        full_name,
        email
      ),
      tasker:users!transactions_tasker_id_fkey(
        full_name,
        email
      ),
      task_requests!transactions_task_id_fkey(
        title
      )
    `)
    .eq('client_id', clientId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ [ADMIN] Error fetching transactions by client:', error);
    throw error;
  }

  console.log('✅ [ADMIN] Fetched transactions by client:', data?.length || 0);
  return data || [];
};

export const getPlatformAnalytics = async () => {
  console.log('🔍 [ADMIN] Fetching platform analytics...');
  
  // This is a simplified analytics implementation
  // In a real app, you'd probably have dedicated analytics tables
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id, role, created_at');

  const { data: tasks, error: tasksError } = await supabase
    .from('task_requests')
    .select('id, status, created_at');

  const { data: transactions, error: transactionsError } = await supabase
    .from('transactions')
    .select('amount, created_at');

  if (usersError || tasksError || transactionsError) {
    console.error('❌ [ADMIN] Error fetching analytics data');
    throw usersError || tasksError || transactionsError;
  }

  const analytics = {
    totalUsers: users?.length || 0,
    totalTaskers: users?.filter(u => u.role === 'tasker').length || 0,
    totalClients: users?.filter(u => u.role === 'client').length || 0,
    totalTasks: tasks?.length || 0,
    completedTasks: tasks?.filter(t => t.status === 'completed').length || 0,
    totalRevenue: transactions?.reduce((sum, t) => sum + Number(t.amount), 0) || 0,
    monthlyUsers: users?.filter(u => {
      const userDate = new Date(u.created_at);
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      return userDate > monthAgo;
    }).length || 0
  };

  console.log('✅ [ADMIN] Fetched analytics:', analytics);
  return analytics;
};

export const getAdminStats = async () => {
  console.log('🔍 [ADMIN] Fetching admin stats...');
  
  const { data: pendingTaskers, error: pendingTaskersError } = await supabase
    .from('users')
    .select('id')
    .eq('role', 'tasker')
    .eq('approved', false);

  const { data: pendingClients, error: pendingClientsError } = await supabase
    .from('task_requests')
    .select('id')
    .eq('needs_location_review', true);

  const { data: allUsers, error: allUsersError } = await supabase
    .from('users')
    .select('id');

  const { data: activeUsers, error: activeUsersError } = await supabase
    .from('users')
    .select('id')
    .eq('approved', true);

  const { data: pendingTransactions, error: pendingTransactionsError } = await supabase
    .from('transactions')
    .select('id')
    .eq('status', 'pending');

  if (pendingTaskersError || pendingClientsError || allUsersError || activeUsersError || pendingTransactionsError) {
    console.error('❌ [ADMIN] Error fetching admin stats');
    throw pendingTaskersError || pendingClientsError || allUsersError || activeUsersError || pendingTransactionsError;
  }

  const stats = {
    pendingTaskers: pendingTaskers?.length || 0,
    pendingClients: pendingClients?.length || 0,
    totalUsers: allUsers?.length || 0,
    activeUsers: activeUsers?.length || 0,
    pendingTransactions: pendingTransactions?.length || 0
  };

  console.log('✅ [ADMIN] Fetched admin stats:', stats);
  return stats;
};
