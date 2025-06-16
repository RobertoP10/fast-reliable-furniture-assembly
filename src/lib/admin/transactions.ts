
import { supabase } from "@/integrations/supabase/client";
import type { Transaction } from "./types";

export const fetchPendingTransactions = async (): Promise<Transaction[]> => {
  console.log('🔍 [ADMIN] Fetching pending transactions...');
  
  const { data, error } = await supabase
    .from('transactions')
    .select(`
      *,
      task_requests!task_id(title, completed_at),
      client:users!client_id(full_name, email),
      tasker:users!tasker_id(full_name, email)
    `)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ [ADMIN] Error fetching pending transactions:', error);
    throw error;
  }

  // Remove duplicates based on task_id, client_id, and tasker_id
  const uniqueTransactions = data?.filter((transaction, index, arr) => {
    return index === arr.findIndex(t => 
      t.task_id === transaction.task_id && 
      t.client_id === transaction.client_id && 
      t.tasker_id === transaction.tasker_id
    );
  }) || [];

  console.log('✅ [ADMIN] Fetched pending transactions (after deduplication):', uniqueTransactions.length);
  return uniqueTransactions;
};

export const fetchAllTransactions = async (): Promise<Transaction[]> => {
  console.log('🔍 [ADMIN] Fetching all transactions...');
  
  const { data, error } = await supabase
    .from('transactions')
    .select(`
      *,
      task_requests!task_id(title, completed_at),
      client:users!client_id(full_name, email),
      tasker:users!tasker_id(full_name, email)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ [ADMIN] Error fetching all transactions:', error);
    throw error;
  }

  console.log('✅ [ADMIN] Fetched all transactions:', data?.length || 0);
  return data || [];
};

export const confirmTransaction = async (transactionId: string) => {
  console.log('🔄 [ADMIN] Confirming transaction:', transactionId);
  
  try {
    // Get current user to verify admin status
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('❌ [ADMIN] No authenticated user found:', userError);
      throw new Error('Authentication required');
    }

    // Verify user is admin
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || userProfile?.role !== 'admin') {
      console.error('❌ [ADMIN] User is not admin:', { profileError, role: userProfile?.role });
      throw new Error('Admin privileges required');
    }

    // Update transaction status
    const { data, error } = await supabase
      .from('transactions')
      .update({ 
        status: 'confirmed',
        admin_confirmed_at: new Date().toISOString(),
        admin_confirmed_by: user.id
      })
      .eq('id', transactionId)
      .select();

    if (error) {
      console.error('❌ [ADMIN] Error confirming transaction:', error);
      throw new Error(`Failed to confirm transaction: ${error.message}`);
    }

    if (!data || data.length === 0) {
      throw new Error('Transaction not found or already confirmed');
    }

    console.log('✅ [ADMIN] Transaction confirmed successfully:', data[0]);
    return { success: true };
  } catch (error) {
    console.error('❌ [ADMIN] Exception confirming transaction:', error);
    throw error;
  }
};
