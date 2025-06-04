
import { supabase } from "@/integrations/supabase/client";
import type { Database } from '@/integrations/supabase/types';

type Task = Database['public']['Tables']['task_requests']['Row'];
type TaskInsert = Database['public']['Tables']['task_requests']['Insert'];
type TaskUpdate = Database['public']['Tables']['task_requests']['Update'];
type TaskStatus = Database['public']['Enums']['task_status'];

// Helper: Task IDs where tasker has offers
const getTaskIdsWithUserOffers = async (userId: string): Promise<string> => {
  const { data, error } = await supabase
    .from('offers')
    .select('task_id')
    .eq('tasker_id', userId);

  if (error || !data?.length) return '';
  return data.map((offer) => offer.task_id).join(',');
};

// Main: fetch tasks for a role
export const fetchTasks = async (
  userRole: 'client' | 'tasker' | 'admin',
  userId: string,
  filters?: { location?: string; status?: TaskStatus }
): Promise<Task[]> => {
  console.log('🔍 [TASKS] Fetching for', userRole, 'user:', userId, 'filters:', filters);

  let query = supabase.from('task_requests').select(`
    *,
    client:users!task_requests_client_id_fkey(full_name, location),
    accepted_offer:offers!task_requests_accepted_offer_id_fkey(
      id,
      price,
      tasker:users!offers_tasker_id_fkey(full_name)
    )
  `);

  if (userRole === 'client') {
    query = query.eq('client_id', userId);
  }

  if (userRole === 'tasker') {
    // See pending tasks or tasks they offered on
    const taskIds = await getTaskIdsWithUserOffers(userId);
    const statusFilter = filters?.status ? `status.eq.${filters.status}` : 'status.eq.pending';
    const orClause = taskIds
      ? `${statusFilter},id.in.(${taskIds})`
      : statusFilter;

    query = query.or(orClause);
  }

  if (userRole === 'admin') {
    // No role-based filter for admin
  }

  // Apply filters if present
  if (filters?.location) {
    query = query.ilike('location', `%${filters.location}%`);
  }

  if (filters?.status && userRole !== 'tasker') {
    query = query.eq('status', filters.status);
  }

  query = query.order('created_at', { ascending: false });

  const { data, error } = await query;
  if (error) {
    console.error('❌ [TASKS] Error fetching:', error);
    throw new Error(`Failed to fetch tasks: ${error.message}`);
  }

  console.log(`✅ [TASKS] Found ${data?.length || 0} tasks`);
  return data || [];
};

// Create a new task
export const createTask = async (taskData: TaskInsert): Promise<Task> => {
  console.log('📝 [TASKS] Creating task:', taskData);

  const { data, error } = await supabase
    .from('task_requests')
    .insert(taskData)
    .select()
    .single();

  if (error) {
    console.error('❌ [TASKS] Error creating task:', error);
    throw new Error(`Failed to create task: ${error.message}`);
  }

  console.log('✅ [TASKS] Task created successfully:', data);
  return data;
};

// Update task status
export const updateTaskStatus = async (
  taskId: string, 
  status: TaskStatus
): Promise<Task> => {
  console.log('📝 [TASKS] Updating task status:', taskId, status);

  const { data, error } = await supabase
    .from('task_requests')
    .update({ status })
    .eq('id', taskId)
    .select()
    .single();

  if (error) {
    console.error('❌ [TASKS] Error updating task status:', error);
    throw new Error(`Failed to update task status: ${error.message}`);
  }

  console.log('✅ [TASKS] Task status updated successfully:', data);
  return data;
};
