import { supabase } from "@/integrations/supabase/client";

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

export const fetchPendingTransactions = async () => {
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

export const fetchAllTransactions = async () => {
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

export const fetchAnalyticsData = async () => {
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
    const taskerMap = new Map();
    const clientMap = new Map();

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
        
        const taskerData = taskerMap.get(tasker.id);
        taskerData.taskCount += 1;
        taskerData.totalEarnings += amount;
        taskerData.totalCommission += commission;
        
        if (transaction.task_requests?.completed_at) {
          const completedAt = new Date(transaction.task_requests.completed_at);
          if (!taskerData.lastTaskDate || completedAt > new Date(taskerData.lastTaskDate)) {
            taskerData.lastTaskDate = transaction.task_requests.completed_at;
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
        
        const clientData = clientMap.get(client.id);
        clientData.taskCount += 1;
        clientData.totalSpent += amount;
        clientData.totalCommission += commission;
        
        if (transaction.task_requests?.completed_at) {
          const completedAt = new Date(transaction.task_requests.completed_at);
          if (!clientData.lastTaskDate || completedAt > new Date(clientData.lastTaskDate)) {
            clientData.lastTaskDate = transaction.task_requests.completed_at;
          }
        }
      }
    });

    const analytics = {
      taskerBreakdown: Array.from(taskerMap.values()),
      clientBreakdown: Array.from(clientMap.values()),
      confirmedTransactions: uniqueTransactions
    };

    console.log('✅ [ADMIN] Analytics data processed:', {
      taskers: analytics.taskerBreakdown.length,
      clients: analytics.clientBreakdown.length,
      transactions: analytics.confirmedTransactions.length
    });

    return analytics;
  } catch (error) {
    console.error('❌ [ADMIN] Error fetching analytics:', error);
    throw error;
  }
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

export const acceptTasker = async (taskerId: string) => {
  console.log('🔄 [ADMIN] Starting approval process for taskerId:', taskerId);
  
  // Validate taskerId
  if (!taskerId || typeof taskerId !== 'string' || taskerId.trim() === '') {
    throw new Error('Invalid tasker ID provided');
  }

  const trimmedId = taskerId.trim();
  console.log('📋 [ADMIN] Processing taskerId:', trimmedId);

  try {
    // First, check if the user exists at all
    console.log('🔍 [ADMIN] Checking if user exists...');
    const { data: userCheck, error: userCheckError } = await supabase
      .from('users')
      .select('id, role, approved, full_name, email')
      .eq('id', trimmedId);

    console.log('🔍 [ADMIN] User check result:', { 
      data: userCheck, 
      error: userCheckError,
      count: userCheck?.length 
    });

    if (userCheckError) {
      console.error('❌ [ADMIN] Error checking user exists:', userCheckError);
      throw new Error(`Database error: ${userCheckError.message}`);
    }

    if (!userCheck || userCheck.length === 0) {
      throw new Error('User not found in database');
    }

    const user = userCheck[0];
    console.log('👤 [ADMIN] Found user:', user);

    // Validate the user can be approved
    if (user.role !== 'tasker') {
      throw new Error(`User is not a tasker (current role: ${user.role})`);
    }

    if (user.approved === true) {
      throw new Error('Tasker is already approved');
    }

    // Perform the approval update
    console.log('🔄 [ADMIN] Performing approval update...');
    const { data: updateData, error: updateError } = await supabase
      .from('users')
      .update({ approved: true })
      .eq('id', trimmedId)
      .select('*');

    console.log('📊 [ADMIN] Update result:', { 
      data: updateData, 
      error: updateError,
      dataLength: updateData?.length 
    });

    if (updateError) {
      console.error('❌ [ADMIN] Update error:', updateError);
      throw new Error(`Failed to approve tasker: ${updateError.message}`);
    }

    if (!updateData || updateData.length === 0) {
      // Final check to see current state
      const { data: finalCheck } = await supabase
        .from('users')
        .select('id, role, approved')
        .eq('id', trimmedId)
        .single();
      
      console.log('🔍 [ADMIN] Final state check:', finalCheck);
      
      if (finalCheck?.approved === true) {
        console.log('✅ [ADMIN] User was approved (possibly by another process)');
        return finalCheck;
      }
      
      throw new Error('Update failed - user may have been deleted or database connection issue');
    }

    console.log('✅ [ADMIN] Tasker approved successfully:', updateData[0]);
    return updateData[0];

  } catch (error) {
    console.error('❌ [ADMIN] Exception during approval:', error);
    throw error;
  }
};

export const rejectTasker = async (taskerId: string) => {
  console.log('🔄 [ADMIN] Starting rejection process for taskerId:', taskerId);
  
  // Validate taskerId
  if (!taskerId || typeof taskerId !== 'string' || taskerId.trim() === '') {
    throw new Error('Invalid tasker ID provided');
  }

  const trimmedId = taskerId.trim();
  console.log('📋 [ADMIN] Processing taskerId:', trimmedId);

  try {
    // First, check if the user exists at all
    console.log('🔍 [ADMIN] Checking if user exists...');
    const { data: userCheck, error: userCheckError } = await supabase
      .from('users')
      .select('id, role, approved, full_name, email')
      .eq('id', trimmedId);

    console.log('🔍 [ADMIN] User check result:', { 
      data: userCheck, 
      error: userCheckError,
      count: userCheck?.length 
    });

    if (userCheckError) {
      console.error('❌ [ADMIN] Error checking user exists:', userCheckError);
      throw new Error(`Database error: ${userCheckError.message}`);
    }

    if (!userCheck || userCheck.length === 0) {
      throw new Error('User not found in database');
    }

    const user = userCheck[0];
    console.log('👤 [ADMIN] Found user:', user);

    // Validate the user can be rejected
    if (user.role !== 'tasker') {
      throw new Error(`User is not a tasker (current role: ${user.role})`);
    }

    // Perform the rejection (deletion)
    console.log('🔄 [ADMIN] Performing rejection deletion...');
    const { data: deleteData, error: deleteError } = await supabase
      .from('users')
      .delete()
      .eq('id', trimmedId)
      .select('*');

    console.log('📊 [ADMIN] Delete result:', { 
      data: deleteData, 
      error: deleteError,
      dataLength: deleteData?.length 
    });

    if (deleteError) {
      console.error('❌ [ADMIN] Delete error:', deleteError);
      throw new Error(`Failed to reject tasker: ${deleteError.message}`);
    }

    if (!deleteData || deleteData.length === 0) {
      // Check if user still exists
      const { data: finalCheck } = await supabase
        .from('users')
        .select('id')
        .eq('id', trimmedId)
        .single();
      
      console.log('🔍 [ADMIN] User exists after delete attempt:', !!finalCheck);
      
      if (!finalCheck) {
        console.log('✅ [ADMIN] User was deleted (possibly by another process)');
        return true;
      }
      
      throw new Error('Delete failed - database connection issue or constraints preventing deletion');
    }

    console.log('✅ [ADMIN] Tasker deleted successfully:', deleteData[0]);
    return true;

  } catch (error) {
    console.error('❌ [ADMIN] Exception during rejection:', error);
    throw error;
  }
};
