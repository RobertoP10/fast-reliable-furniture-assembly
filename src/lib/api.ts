
import { supabase } from "@/integrations/supabase/client";
import type { Database } from '@/integrations/supabase/types';

type TaskRequest = Database['public']['Tables']['task_requests']['Row'];
type TaskRequestInsert = Database['public']['Tables']['task_requests']['Insert'];
type TaskStatus = Database['public']['Enums']['task_status'];
type PaymentMethod = Database['public']['Enums']['payment_method'];
type Offer = Database['public']['Tables']['offers']['Row'];
type OfferInsert = Database['public']['Tables']['offers']['Insert'];

// Fetch all tasks based on user role
export const fetchTasks = async (userRole: string, userId?: string): Promise<TaskRequest[]> => {
  let query = supabase.from('task_requests').select('*');

  if (userRole === 'client' && userId) {
    // Clients see their own tasks
    query = query.eq('client_id', userId);
  } else if (userRole === 'tasker') {
    // Taskers see pending tasks and tasks they have offers on
    query = query.or(`status.eq.pending,and(status.neq.pending,id.in.(select task_id from offers where tasker_id.eq.${userId}))`);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching tasks:', error);
    throw new Error(error.message);
  }

  return data || [];
};

// Fetch offers for a specific task
export const fetchOffers = async (taskId: string): Promise<Offer[]> => {
  const { data, error } = await supabase
    .from('offers')
    .select(`
      *,
      tasker:users!offers_tasker_id_fkey(name, rating, total_reviews)
    `)
    .eq('task_id', taskId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching offers:', error);
    throw new Error(error.message);
  }

  return data || [];
};

// Fetch user's offers
export const fetchUserOffers = async (userId: string): Promise<Offer[]> => {
  const { data, error } = await supabase
    .from('offers')
    .select(`
      *,
      task:task_requests!offers_task_id_fkey(title, description, location, status)
    `)
    .eq('tasker_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching user offers:', error);
    throw new Error(error.message);
  }

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
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating task:', error);
    throw new Error(error.message);
  }

  return data;
};

// Update task status
export const updateTaskStatus = async (taskId: string, status: TaskStatus): Promise<void> => {
  const { error } = await supabase
    .from('task_requests')
    .update({ status })
    .eq('id', taskId);

  if (error) {
    console.error('Error updating task status:', error);
    throw new Error(error.message);
  }
};

// Create an offer
export const createOffer = async (offerData: {
  task_id: string;
  tasker_id: string;
  price: number;
  message: string;
}): Promise<Offer> => {
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
    console.error('Error creating offer:', error);
    throw new Error(error.message);
  }

  return data;
};

// Accept an offer
export const acceptOffer = async (offerId: string): Promise<void> => {
  const { error } = await supabase
    .from('offers')
    .update({ is_accepted: true })
    .eq('id', offerId);

  if (error) {
    console.error('Error accepting offer:', error);
    throw new Error(error.message);
  }
};

// Fetch pending taskers for admin approval
export const fetchPendingTaskers = async () => {
  const { error } = await supabase
    .from('users')
    .update({ status: 'approved' })
    .eq('role', 'tasker')
    .eq('approved', false);

  if (error) {
    console.error('Error fetching pending taskers:', error);
    throw new Error(error.message);
  }
};

// Accept a tasker
export const acceptTasker = async (taskerId: string): Promise<void> => {
  const { error } = await supabase
    .from('users')
    .update({ approved: true })
    .eq('id', taskerId);

  if (error) {
    console.error('Error accepting tasker:', error);
    throw new Error(error.message);
  }
};
