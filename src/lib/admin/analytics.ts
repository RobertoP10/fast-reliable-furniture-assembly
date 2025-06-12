
import { supabase } from "@/integrations/supabase/client";

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
