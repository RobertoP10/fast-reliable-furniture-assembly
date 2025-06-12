
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
    .eq('role', 'tasker')
    .select();

  if (error) {
    console.error('❌ [ADMIN] Error approving tasker:', error);
    throw error;
  }

  if (!data || data.length === 0) {
    console.error('❌ [ADMIN] No rows updated for tasker:', taskerId);
    throw new Error('Tasker not found or already approved');
  }

  console.log('✅ [ADMIN] Tasker approved successfully:', data);
  return data[0];
};

export const acceptTasker = approveTasker; // Alias for compatibility

export const rejectTasker = async (taskerId: string) => {
  console.log('❌ [ADMIN] Rejecting tasker:', taskerId);
  
  // Delete the tasker account entirely for rejection
  const { data, error } = await supabase
    .from('users')
    .delete()
    .eq('id', taskerId)
    .eq('role', 'tasker')
    .select();

  if (error) {
    console.error('❌ [ADMIN] Error rejecting tasker:', error);
    throw error;
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
      status: 'confirmed',
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
  
  try {
    // Fetch confirmed transactions with task and user data
    const { data: confirmedTransactions, error: transactionsError } = await supabase
      .from('transactions')
      .select(`
        *,
        client:users!transactions_client_id_fkey(
          full_name,
          email
        ),
        tasker:users!transactions_tasker_id_fkey(
          full_name,
          email,
          rating
        ),
        task_requests!transactions_task_id_fkey(
          title,
          completed_at,
          status
        )
      `)
      .eq('status', 'confirmed')
      .order('created_at', { ascending: false });

    if (transactionsError) {
      console.error('❌ [ADMIN] Error fetching confirmed transactions:', transactionsError);
      throw transactionsError;
    }

    console.log('✅ [ADMIN] Fetched confirmed transactions:', confirmedTransactions?.length || 0);

    // Process confirmed transactions to create tasker and client breakdowns
    const taskerMap = new Map();
    const clientMap = new Map();

    confirmedTransactions?.forEach((transaction: any) => {
      if (transaction.tasker && transaction.client) {
        // Process tasker data
        const taskerId = transaction.tasker_id;
        if (!taskerMap.has(taskerId)) {
          taskerMap.set(taskerId, {
            id: taskerId,
            name: transaction.tasker.full_name,
            taskCount: 0,
            totalEarnings: 0,
            totalCommission: 0,
            lastTaskDate: null,
            averageRating: transaction.tasker.rating || 0
          });
        }
        
        const taskerData = taskerMap.get(taskerId);
        taskerData.taskCount += 1;
        taskerData.totalEarnings += Number(transaction.amount) || 0;
        taskerData.totalCommission += (Number(transaction.amount) || 0) * 0.2;
        
        if (transaction.task_requests?.completed_at) {
          const completedDate = transaction.task_requests.completed_at;
          if (!taskerData.lastTaskDate || new Date(completedDate) > new Date(taskerData.lastTaskDate)) {
            taskerData.lastTaskDate = completedDate;
          }
        }

        // Process client data
        const clientId = transaction.client_id;
        if (!clientMap.has(clientId)) {
          clientMap.set(clientId, {
            id: clientId,
            name: transaction.client.full_name,
            taskCount: 0,
            totalSpent: 0,
            totalCommission: 0,
            lastTaskDate: null,
            averageRating: 0 // Client ratings would need to be calculated from reviews
          });
        }
        
        const clientData = clientMap.get(clientId);
        clientData.taskCount += 1;
        clientData.totalSpent += Number(transaction.amount) || 0;
        clientData.totalCommission += (Number(transaction.amount) || 0) * 0.2;
        
        if (transaction.task_requests?.completed_at) {
          const completedDate = transaction.task_requests.completed_at;
          if (!clientData.lastTaskDate || new Date(completedDate) > new Date(clientData.lastTaskDate)) {
            clientData.lastTaskDate = completedDate;
          }
        }
      }
    });

    const analytics = {
      confirmedTransactions: confirmedTransactions || [],
      taskerBreakdown: Array.from(taskerMap.values()).sort((a, b) => b.totalEarnings - a.totalEarnings),
      clientBreakdown: Array.from(clientMap.values()).sort((a, b) => b.totalSpent - a.totalSpent)
    };

    console.log('✅ [ADMIN] Processed analytics:', {
      transactions: analytics.confirmedTransactions.length,
      taskers: analytics.taskerBreakdown.length,
      clients: analytics.clientBreakdown.length
    });

    return analytics;
  } catch (error) {
    console.error('❌ [ADMIN] Error in getPlatformAnalytics:', error);
    throw error;
  }
};

export const getAdminStats = async () => {
  console.log('🔍 [ADMIN] Fetching admin stats...');
  
  const { data: pendingTaskers, error: pendingTaskersError } = await supabase
    .from('users')
    .select('id')
    .eq('role', 'tasker')
    .eq('approved', false);

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

  if (pendingTaskersError || allUsersError || activeUsersError || pendingTransactionsError) {
    console.error('❌ [ADMIN] Error fetching admin stats');
    throw pendingTaskersError || allUsersError || activeUsersError || pendingTransactionsError;
  }

  const stats = {
    pendingTaskers: pendingTaskers?.length || 0,
    pendingClients: 0, // Remove pending clients functionality for now
    totalUsers: allUsers?.length || 0,
    activeUsers: activeUsers?.length || 0,
    pendingTransactions: pendingTransactions?.length || 0
  };

  console.log('✅ [ADMIN] Fetched admin stats:', stats);
  return stats;
};
