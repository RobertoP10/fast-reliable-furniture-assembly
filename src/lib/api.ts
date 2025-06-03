
import { supabase } from "@/integrations/supabase/client";
import type { Database } from '@/integrations/supabase/types';

type TaskRequest = Database['public']['Tables']['task_requests']['Row'];
type TaskRequestInsert = Database['public']['Tables']['task_requests']['Insert'];
type TaskStatus = Database['public']['Enums']['task_status'];
type PaymentMethod = Database['public']['Enums']['payment_method'];
type Offer = Database['public']['Tables']['offers']['Row'];
type OfferInsert = Database['public']['Tables']['offers']['Insert'];
type User = Database['public']['Tables']['users']['Row'];

// Enhanced session validation with detailed logging
export const validateUserSession = async (): Promise<{ session: any; profile: any } | null> => {
  try {
    console.log('🔍 [API] Starting session validation...');
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ [API] Session validation error:', sessionError);
      return null;
    }

    if (!session?.user) {
      console.log('ℹ️ [API] No active session found');
      return null;
    }

    console.log('✅ [API] Session validation successful:', {
      userId: session.user.id,
      email: session.user.email,
      accessToken: session.access_token ? 'present' : 'missing'
    });

    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (profileError) {
      console.error('❌ [API] Profile fetch error:', profileError);
      return { session, profile: null };
    }

    console.log('✅ [API] Profile validation successful:', {
      userId: profile?.id,
      role: profile?.role,
      approved: profile?.approved,
      email: profile?.email
    });
    
    return { session, profile };
    
  } catch (error) {
    console.error('❌ [API] Exception in validateUserSession:', error);
    return null;
  }
};

// Fetch all tasks based on user role
export const fetchTasks = async (userRole: string, userId?: string): Promise<TaskRequest[]> => {
  console.log('🔍 [API] Fetching tasks for:', userRole, 'userId:', userId);
  
  try {
    let query = supabase.from('task_requests').select('*');

    if (userRole === 'client' && userId) {
      // Clients see their own tasks
      query = query.eq('client_id', userId);
    } else if (userRole === 'tasker') {
      // Taskers see all pending tasks (they can make offers on any pending task)
      query = query.eq('status', 'pending');
    }
    // Admins see all tasks (no additional filtering)

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('❌ [API] Error fetching tasks:', error);
      throw new Error(`Failed to fetch tasks: ${error.message}`);
    }

    console.log('✅ [API] Tasks fetched successfully:', data?.length || 0, 'tasks');
    return data || [];
  } catch (error) {
    console.error('❌ [API] Exception in fetchTasks:', error);
    throw error;
  }
};

// Fetch offers for a specific task
export const fetchOffers = async (taskId: string): Promise<Offer[]> => {
  console.log('🔍 [API] Fetching offers for task:', taskId);
  
  const { data, error } = await supabase
    .from('offers')
    .select(`
      *,
      tasker:users!offers_tasker_id_fkey(full_name, approved)
    `)
    .eq('task_id', taskId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ [API] Error fetching offers:', error);
    throw new Error(`Failed to fetch offers: ${error.message}`);
  }

  console.log('✅ [API] Offers fetched successfully:', data?.length || 0, 'offers');
  return data || [];
};

// Fetch user's offers
export const fetchUserOffers = async (userId: string): Promise<Offer[]> => {
  console.log('🔍 [API] Fetching offers for user:', userId);
  
  const { data, error } = await supabase
    .from('offers')
    .select(`
      *,
      task:task_requests!offers_task_id_fkey(title, description, location, status)
    `)
    .eq('tasker_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ [API] Error fetching user offers:', error);
    throw new Error(`Failed to fetch user offers: ${error.message}`);
  }

  console.log('✅ [API] User offers fetched successfully:', data?.length || 0, 'offers');
  return data || [];
};

// Create a new task
export const createTask = async (taskData: {
  title: string;
  description: string;
  category: string;
  subcategory: string;
  price_range_min: number;
  price_range_max: number;
  location: string;
  payment_method: PaymentMethod;
  client_id: string;
}): Promise<TaskRequest> => {
  console.log('📝 [API] Creating new task:', taskData.title, 'for client:', taskData.client_id);
  
  const { data, error } = await supabase
    .from('task_requests')
    .insert({
      client_id: taskData.client_id,
      title: taskData.title,
      description: taskData.description,
      category: taskData.category,
      subcategory: taskData.subcategory,
      price_range_min: taskData.price_range_min,
      price_range_max: taskData.price_range_max,
      location: taskData.location,
      payment_method: taskData.payment_method,
      status: 'pending'
    })
    .select()
    .single();

  if (error) {
    console.error('❌ [API] Error creating task:', error);
    throw new Error(`Failed to create task: ${error.message}`);
  }

  console.log('✅ [API] Task created successfully with ID:', data.id);
  return data;
};

// Update task status
export const updateTaskStatus = async (taskId: string, status: TaskStatus): Promise<void> => {
  console.log('📝 [API] Updating task status:', taskId, 'to', status);
  
  const { error } = await supabase
    .from('task_requests')
    .update({ status })
    .eq('id', taskId);

  if (error) {
    console.error('❌ [API] Error updating task status:', error);
    throw new Error(`Failed to update task status: ${error.message}`);
  }

  console.log('✅ [API] Task status updated successfully');
};

// Create an offer
export const createOffer = async (offerData: {
  task_id: string;
  tasker_id: string;
  price: number;
  message: string;
}): Promise<Offer> => {
  console.log('📝 [API] Creating new offer for task:', offerData.task_id, 'by tasker:', offerData.tasker_id);
  
  const { data, error } = await supabase
    .from('offers')
    .insert({
      tasker_id: offerData.tasker_id,
      task_id: offerData.task_id,
      price: offerData.price,
      message: offerData.message,
    })
    .select()
    .single();

  if (error) {
    console.error('❌ [API] Error creating offer:', error);
    throw new Error(`Failed to create offer: ${error.message}`);
  }

  console.log('✅ [API] Offer created successfully with ID:', data.id);
  return data;
};

// Accept an offer
export const acceptOffer = async (offerId: string): Promise<void> => {
  console.log('📝 [API] Accepting offer:', offerId);
  
  const { error } = await supabase
    .from('offers')
    .update({ is_accepted: true })
    .eq('id', offerId);

  if (error) {
    console.error('❌ [API] Error accepting offer:', error);
    throw new Error(`Failed to accept offer: ${error.message}`);
  }

  console.log('✅ [API] Offer accepted successfully');
};

// Admin functions - Fetch all users (admins can see all users due to RLS policy)
export const fetchAllUsers = async (): Promise<(User & { last_sign_in_at?: string })[]> => {
  console.log('🔍 [API] Fetching all users for admin');
  
  try {
    // Get all users from our users table (RLS policy allows admins to see all)
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (usersError) {
      console.error('❌ [API] Error fetching users from users table:', usersError);
      throw new Error(`Failed to fetch users: ${usersError.message}`);
    }

    // Try to get auth users for last sign in data (this might fail if not admin)
    try {
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
      
      if (!authError && authUsers) {
        // Merge the data with proper type handling
        const enrichedUsers = (usersData || []).map((user: User) => {
          const authUser = authUsers.users.find((au: any) => au.id === user.id);
          return {
            ...user,
            last_sign_in_at: authUser?.last_sign_in_at || undefined
          };
        });

        console.log('✅ [API] Users fetched successfully with auth data:', enrichedUsers.length, 'users');
        return enrichedUsers;
      }
    } catch (authError) {
      console.warn('⚠️ [API] Could not fetch auth users for last sign in data:', authError);
    }

    // Return users without last_sign_in_at if auth.admin is not available
    console.log('✅ [API] Users fetched successfully (without auth data):', usersData?.length || 0, 'users');
    return usersData || [];
  } catch (error) {
    console.error('❌ [API] Exception in fetchAllUsers:', error);
    throw error;
  }
};

export const fetchPendingTaskers = async (): Promise<User[]> => {
  console.log('🔍 [API] Fetching pending taskers for admin review');
  
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('role', 'tasker')
    .eq('approved', false)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ [API] Error fetching pending taskers:', error);
    throw new Error(`Failed to fetch pending taskers: ${error.message}`);
  }

  console.log('✅ [API] Pending taskers fetched successfully:', data?.length || 0, 'pending');
  return data || [];
};

export const fetchPendingTransactions = async () => {
  console.log('🔍 [API] Fetching pending transactions for admin');
  
  const { data, error } = await supabase
    .from('transactions')
    .select(`
      *,
      task:task_requests!transactions_task_id_fkey(title),
      client:users!transactions_client_id_fkey(full_name),
      tasker:users!transactions_tasker_id_fkey(full_name)
    `)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ [API] Error fetching transactions:', error);
    throw new Error(`Failed to fetch transactions: ${error.message}`);
  }

  console.log('✅ [API] Transactions fetched successfully:', data?.length || 0, 'transactions');
  return data || [];
};

// Accept a tasker
export const acceptTasker = async (taskerId: string): Promise<void> => {
  console.log('📝 [API] Accepting tasker:', taskerId);
  
  const { error } = await supabase
    .from('users')
    .update({ approved: true })
    .eq('id', taskerId);

  if (error) {
    console.error('❌ [API] Error accepting tasker:', error);
    throw new Error(`Failed to accept tasker: ${error.message}`);
  }

  console.log('✅ [API] Tasker accepted successfully');
};

// Reject a tasker
export const rejectTasker = async (taskerId: string): Promise<void> => {
  console.log('📝 [API] Rejecting tasker:', taskerId);
  
  const { error } = await supabase
    .from('users')
    .delete()
    .eq('id', taskerId);

  if (error) {
    console.error('❌ [API] Error rejecting tasker:', error);
    throw new Error(`Failed to reject tasker: ${error.message}`);
  }

  console.log('✅ [API] Tasker rejected successfully');
};
