
import { supabase } from "@/integrations/supabase/client";

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

  const { data: pendingClientTasks, error: pendingClientTasksError } = await supabase
    .from('task_requests')
    .select('id')
    .eq('needs_location_review', true);

  if (pendingTaskersError || allUsersError || activeUsersError || pendingTransactionsError || pendingClientTasksError) {
    console.error('❌ [ADMIN] Error fetching admin stats');
    throw pendingTaskersError || allUsersError || activeUsersError || pendingTransactionsError || pendingClientTasksError;
  }

  const stats = {
    pendingTaskers: pendingTaskers?.length || 0,
    pendingClients: pendingClientTasks?.length || 0,
    totalUsers: allUsers?.length || 0,
    activeUsers: activeUsers?.length || 0,
    pendingTransactions: pendingTransactions?.length || 0
  };

  console.log('✅ [ADMIN] Fetched admin stats:', stats);
  return stats;
};
