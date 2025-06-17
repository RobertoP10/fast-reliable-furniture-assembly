
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

    console.log('🔍 [ADMIN] Raw confirmed transactions:', confirmedTransactions);

    // Remove duplicates based on task_id, client_id, and tasker_id
    const uniqueTransactions = confirmedTransactions?.filter((transaction, index, arr) => {
      return index === arr.findIndex(t => 
        t.task_id === transaction.task_id && 
        t.client_id === transaction.client_id && 
        t.tasker_id === transaction.tasker_id
      );
    }) || [];

    console.log('🔍 [ADMIN] Unique transactions:', uniqueTransactions);

    // Process tasker breakdown
    const taskerMap = new Map<string, TaskerBreakdown>();
    const clientMap = new Map<string, ClientBreakdown>();

    uniqueTransactions.forEach(transaction => {
      const tasker = transaction.tasker;
      const client = transaction.client;
      const amount = Number(transaction.amount) || 0;
      const commission = amount * 0.2;

      console.log('🔍 [ADMIN] Processing transaction:', {
        id: transaction.id,
        task_requests: transaction.task_requests,
        completed_at: transaction.task_requests?.completed_at,
        tasker: tasker?.full_name,
        client: client?.full_name
      });

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
        
        // FIXED: Better date handling for lastTaskDate using completed_at from task_requests
        const completedAt = transaction.task_requests?.completed_at;
        if (completedAt) {
          try {
            const completedDate = new Date(completedAt);
            console.log('📅 [ADMIN] Processing completed date for tasker:', tasker.full_name, {
              rawDate: completedAt,
              parsedDate: completedDate,
              isValid: !isNaN(completedDate.getTime())
            });
            
            if (!isNaN(completedDate.getTime())) {
              const currentLastDate = taskerData.lastTaskDate ? new Date(taskerData.lastTaskDate) : null;
              
              if (!currentLastDate || completedDate > currentLastDate) {
                taskerData.lastTaskDate = completedDate.toISOString();
                console.log('📅 [ADMIN] Updated tasker lastTaskDate:', tasker.full_name, taskerData.lastTaskDate);
              }
            }
          } catch (error) {
            console.warn('❌ [ADMIN] Error parsing completed_at for tasker:', tasker.id, completedAt, error);
          }
        } else {
          console.warn('❌ [ADMIN] No completed_at date for tasker transaction:', transaction.id);
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
        
        // FIXED: Better date handling for lastTaskDate using completed_at from task_requests
        const completedAt = transaction.task_requests?.completed_at;
        if (completedAt) {
          try {
            const completedDate = new Date(completedAt);
            console.log('📅 [ADMIN] Processing completed date for client:', client.full_name, {
              rawDate: completedAt,
              parsedDate: completedDate,
              isValid: !isNaN(completedDate.getTime())
            });
            
            if (!isNaN(completedDate.getTime())) {
              const currentLastDate = clientData.lastTaskDate ? new Date(clientData.lastTaskDate) : null;
              
              if (!currentLastDate || completedDate > currentLastDate) {
                clientData.lastTaskDate = completedDate.toISOString();
                console.log('📅 [ADMIN] Updated client lastTaskDate:', client.full_name, clientData.lastTaskDate);
              }
            }
          } catch (error) {
            console.warn('❌ [ADMIN] Error parsing completed_at for client:', client.id, completedAt, error);
          }
        } else {
          console.warn('❌ [ADMIN] No completed_at date for client transaction:', transaction.id);
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

    // Debug log the final date formats
    console.log('📅 [ADMIN] Final tasker dates:', analytics.taskerBreakdown.map(t => ({ name: t.name, lastTaskDate: t.lastTaskDate })));
    console.log('📅 [ADMIN] Final client dates:', analytics.clientBreakdown.map(c => ({ name: c.name, lastTaskDate: c.lastTaskDate })));

    return analytics;
  } catch (error) {
    console.error('❌ [ADMIN] Error fetching analytics:', error);
    throw error;
  }
};
