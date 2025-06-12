
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
