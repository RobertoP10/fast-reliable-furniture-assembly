
import { supabase } from "@/integrations/supabase/client";

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
