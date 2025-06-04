import { supabase } from "@/integrations/supabase/client";
import type { Database } from '@/integrations/supabase/types';

type Task = Database['public']['Tables']['task_requests']['Row'];
type TaskInsert = Database['public']['Tables']['task_requests']['Insert'];
type TaskUpdate = Database['public']['Tables']['task_requests']['Update'];
type TaskStatus = Database['public']['Enums']['task_status'];

// Fetch tasks based on user role and tab context
export const fetchTasks = async (
  userId: string,
  userRole: string,
  location?: string,
  activeTab?: 'available' | 'my-tasks' | 'completed'
): Promise<Task[]> => {
  console.log('🔍 [TASKS] Fetching tasks for:', userId, '| role:', userRole, '| tab:', activeTab);

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
  } else if (userRole === 'tasker') {
    if (activeTab === 'available') {
      const ids = await getTaskIdsWithUserOffers(userId);
      if (ids) {
        query = query.or(`status.eq.pending,id.in.(${ids})`);
      } else {
        query = query.eq('status', 'pending');
      }
      if (location) {
        query = query.ilike('location', `%${location}%`);
      }
    } else if (activeTab === 'completed') {
      query = query.eq('status', 'completed');
    } else if (activeTab === 'my-tasks') {
      // handled via fetchUserOffers elsewhere
      return [];
    }
  }
  // admin → no filter

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) {
    console.error('❌ [TASKS] Error fetching tasks:', error);
    throw new Error(`Failed to fetch tasks: ${error.message}`);
  }

  console.log('✅ [TASKS] Fetched:', data?.length || 0);
  return data || [];
};

// Helper: get task IDs for offers made by this tasker
const getTaskIdsWithUserOffers = async (userId: string): Promise<string> => {
  const { data, error } = await supabase
    .from('offers')
    .select('task_id')
    .eq('tasker_id', userId);

  if (error || !data || data.length === 0) return '';
  return data.map((offer) => `'${offer.task_id}'`).join(',');
};

// Create a new task
export const createTask = async (taskData: Omit<TaskInsert, 'id' | 'created_at' | 'updated_at'>): Promise<Task> => {
  console.log('📝 [TASKS] Creating task:', taskData.title);
  const { data, error } = await supabase
    .from('task_requests')
    .insert(taskData)
    .select()
    .single();

  if (error) {
    console.error('❌ [TASKS] Error creating task:', error);
    throw new Error(`Failed to create task: ${error.message}`);
  }

  console.log('✅ [TASKS] Task created with ID:', data.id);
  return data;
};

// Update task status
export const updateTaskStatus = async (
  taskId: string,
  status: TaskStatus,
  updates?: Partial<TaskUpdate>
): Promise<void> => {
  console.log('📝 [TASKS] Updating task:', taskId, '→ status:', status);
  const updateData: TaskUpdate = { status, ...updates };

  const { error } = await supabase
    .from('task_requests')
    .update(updateData)
    .eq('id', taskId);

  if (error) {
    console.error('❌ [TASKS] Error updating status:', error);
    throw new Error(`Failed to update task status: ${error.message}`);
  }

  console.log('✅ [TASKS] Status updated');
};

// Get single task
export const fetchTask = async (taskId: string): Promise<Task | null> => {
  console.log('🔍 [TASKS] Fetching task by ID:', taskId);

  const { data, error } = await supabase
    .from('task_requests')
    .select(`
      *,
      client:users!task_requests_client_id_fkey(full_name, location),
      accepted_offer:offers!task_requests_accepted_offer_id_fkey(
        id,
        price,
        tasker:users!offers_tasker_id_fkey(full_name)
      )
    `)
    .eq('id', taskId)
    .single();

  if (error) {
    console.error('❌ [TASKS] Error fetching task:', error);
    return null;
  }

  console.log('✅ [TASKS] Task fetched');
  return data;
};
