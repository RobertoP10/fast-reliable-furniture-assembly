
import { supabase } from "@/integrations/supabase/client";
import type { AnalyticsData, TaskerBreakdown, ClientBreakdown, Transaction } from "./types";

export const fetchAnalyticsData = async (): Promise<AnalyticsData> => {
  console.log('🔍 [ADMIN] Fetching analytics data...');
  
  try {
    // Fetch confirmed transactions with related data
    const { data: confirmedTransactions, error: transError } = await supabase
      .from('transactions')
      .select(`
        *,
        task_requests!task_id(title, completed_at),
        client:users!client_id(id, full_name, email),
        tasker:users!tasker_id(id, full_name, email)
      `)
      .eq('status', 'confirmed')
      .order('created_at', { ascending: false });

    if (transError) {
      console.error('❌ [ADMIN] Error fetching confirmed transactions:', transError);
      throw transError;
    }

    // Remove duplicates based on task_id, client_id, and tasker_id
    const uniqueTransactions = confirmedTransactions?.filter((transaction, index, arr) => {
      return index === arr.findIndex(t => 
        t.task_id === transaction.task_id && 
        t.client_id === transaction.client_id && 
        t.tasker_id === transaction.tasker_id
      );
    }) || [];

    // Process tasker breakdown
    const taskerMap = new Map<string, TaskerBreakdown>();
    const clientMap = new Map<string, ClientBreakdown>();

    uniqueTransactions.forEach(transaction => {
      const tasker = transaction.tasker;
      const client = transaction.client;
      const amount = Number(transaction.amount) || 0;
      const commission = amount * 0.2;

      // Process tasker data
      if (tasker) {
        if (!taskerMap.has(tasker.id)) {
          taskerMap.set(tasker.id, {
            id: tasker.id,
            name: tasker.full_name,
            taskCount: 0,
            totalEarnings: 0,
            totalCommission: 0,
            lastTaskDate: null,
            averageRating: 0
          });
        }
        
        const taskerData = taskerMap.get(tasker.id)!;
        taskerData.taskCount += 1;
        taskerData.totalEarnings += amount;
        taskerData.totalCommission += commission;
        
        // Improved date handling for lastTaskDate
        if (transaction.task_requests?.completed_at) {
          const completedAt = new Date(transaction.task_requests.completed_at);
          
          // Ensure we have a valid date
          if (!isNaN(completedAt.getTime())) {
            if (!taskerData.lastTaskDate || completedAt > new Date(taskerData.lastTaskDate)) {
              // Store as ISO string for consistency
              taskerData.lastTaskDate = completedAt.toISOString();
            }
          } else {
            console.warn('❌ [ADMIN] Invalid completed_at date for tasker:', tasker.id, transaction.task_requests.completed_at);
          }
        }
      }

      // Process client data
      if (client) {
        if (!clientMap.has(client.id)) {
          clientMap.set(client.id, {
            id: client.id,
            name: client.full_name,
            taskCount: 0,
            totalSpent: 0,
            totalCommission: 0,
            lastTaskDate: null,
            averageRating: 0
          });
        }
        
        const clientData = clientMap.get(client.id)!;
        clientData.taskCount += 1;
        clientData.totalSpent += amount;
        clientData.totalCommission += commission;
        
        // Improved date handling for lastTaskDate
        if (transaction.task_requests?.completed_at) {
          const completedAt = new Date(transaction.task_requests.completed_at);
          
          // Ensure we have a valid date
          if (!isNaN(completedAt.getTime())) {
            if (!clientData.lastTaskDate || completedAt > new Date(clientData.lastTaskDate)) {
              // Store as ISO string for consistency
              clientData.lastTaskDate = completedAt.toISOString();
            }
          } else {
            console.warn('❌ [ADMIN] Invalid completed_at date for client:', client.id, transaction.task_requests.completed_at);
          }
        }
      }
    });

    const analytics: AnalyticsData = {
      taskerBreakdown: Array.from(taskerMap.values()),
      clientBreakdown: Array.from(clientMap.values()),
      confirmedTransactions: uniqueTransactions
    };

    console.log('✅ [ADMIN] Analytics data processed:', {
      taskers: analytics.taskerBreakdown.length,
      clients: analytics.clientBreakdown.length,
      transactions: analytics.confirmedTransactions.length
    });

    // Debug log the date formats
    console.log('📅 [ADMIN] Sample tasker dates:', analytics.taskerBreakdown.slice(0, 3).map(t => ({ name: t.name, lastTaskDate: t.lastTaskDate })));
    console.log('📅 [ADMIN] Sample client dates:', analytics.clientBreakdown.slice(0, 3).map(c => ({ name: c.name, lastTaskDate: c.lastTaskDate })));

    return analytics;
  } catch (error) {
    console.error('❌ [ADMIN] Error fetching analytics:', error);
    throw error;
  }
};
