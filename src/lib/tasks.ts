
import { supabase } from "@/integrations/supabase/client";
import type { Database } from '@/integrations/supabase/types';

type TaskRequest = Database['public']['Tables']['task_requests']['Row'];
type TaskStatus = Database['public']['Enums']['task_status'];
type PaymentMethod = Database['public']['Enums']['payment_method'];

// Fetch all tasks based on user role
export const fetchTasks = async (userRole: string, userId?: string): Promise<TaskRequest[]> => {
  console.log('🔍 [TASKS] Fetching tasks for:', userRole, 'userId:', userId);
  
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
      console.error('❌ [TASKS] Error fetching tasks:', error);
      throw new Error(`Failed to fetch tasks: ${error.message}`);
    }

    console.log('✅ [TASKS] Tasks fetched successfully:', data?.length || 0, 'tasks');
    return data || [];
  } catch (error) {
    console.error('❌ [TASKS] Exception in fetchTasks:', error);
    throw error;
  }
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
  console.log('📝 [TASKS] Creating new task:', taskData.title, 'for client:', taskData.client_id);
  
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
    console.error('❌ [TASKS] Error creating task:', error);
    throw new Error(`Failed to create task: ${error.message}`);
  }

  console.log('✅ [TASKS] Task created successfully with ID:', data.id);
  return data;
};

// Update task status
export const updateTaskStatus = async (taskId: string, status: TaskStatus): Promise<void> => {
  console.log('📝 [TASKS] Updating task status:', taskId, 'to', status);
  
  const { error } = await supabase
    .from('task_requests')
    .update({ status })
    .eq('id', taskId);

  if (error) {
    console.error('❌ [TASKS] Error updating task status:', error);
    throw new Error(`Failed to update task status: ${error.message}`);
  }

  console.log('✅ [TASKS] Task status updated successfully');
};
