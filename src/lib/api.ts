
import { supabase } from "@/integrations/supabase/client";
import type { TaskRequest, Offer, Message, User, PartialUser, PaymentMethod, TaskStatus } from "@/types/database";

// Task API functions
export const taskAPI = {
  // Get available tasks (for taskers)
  async getAvailableTasks(): Promise<TaskRequest[]> {
    const { data, error } = await supabase
      .from('task_requests')
      .select(`
        *,
        client:users!client_id(id, name, location),
        offers_count:offers(count)
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    // Transform the data to match our interface
    return (data || []).map(task => ({
      ...task,
      client: task.client as PartialUser,
      offers_count: task.offers_count?.[0]?.count || 0
    }));
  },

  // Get user's own tasks (for clients)
  async getMyTasks(): Promise<TaskRequest[]> {
    const { data, error } = await supabase
      .from('task_requests')
      .select(`
        *,
        offers(
          id,
          tasker_id,
          price,
          message,
          status,
          created_at,
          tasker:users!tasker_id(id, name, location)
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    return (data || []).map(task => ({
      ...task,
      offers: (task.offers || []).map((offer: any) => ({
        ...offer,
        tasker: offer.tasker as PartialUser
      }))
    }));
  },

  // Get tasks where user has made offers (for taskers)
  async getTasksWithMyOffers(): Promise<TaskRequest[]> {
    const { data, error } = await supabase
      .from('task_requests')
      .select(`
        *,
        client:users!client_id(id, name, location),
        offers!inner(
          id,
          price,
          message,
          status,
          created_at
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    return (data || []).map(task => ({
      ...task,
      client: task.client as PartialUser,
      offers: task.offers || []
    }));
  },

  // Create a new task
  async createTask(taskData: {
    title: string;
    description: string;
    category: string;
    subcategory?: string;
    price_range_min?: number;
    price_range_max?: number;
    location: string;
    payment_method: string;
  }): Promise<TaskRequest> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('task_requests')
      .insert({
        client_id: user.id,
        title: taskData.title,
        description: taskData.description,
        category: taskData.category,
        subcategory: taskData.subcategory,
        price_range_min: taskData.price_range_min,
        price_range_max: taskData.price_range_max,
        location: taskData.location,
        payment_method: taskData.payment_method as PaymentMethod
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update task status
  async updateTaskStatus(taskId: string, status: string): Promise<void> {
    const { error } = await supabase
      .from('task_requests')
      .update({ status: status as TaskStatus })
      .eq('id', taskId);

    if (error) throw error;
  }
};

// Offer API functions
export const offerAPI = {
  // Create an offer
  async createOffer(offerData: {
    task_id: string;
    price: number;
    message?: string;
  }): Promise<Offer> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('offers')
      .insert({
        tasker_id: user.id,
        task_id: offerData.task_id,
        price: offerData.price,
        message: offerData.message
      })
      .select(`
        *,
        tasker:users!tasker_id(id, name, location)
      `)
      .single();

    if (error) throw error;
    
    return {
      ...data,
      tasker: data.tasker as PartialUser
    };
  },

  // Get offers for a task
  async getTaskOffers(taskId: string): Promise<Offer[]> {
    const { data, error } = await supabase
      .from('offers')
      .select(`
        *,
        tasker:users!tasker_id(id, name, location, profile_photo)
      `)
      .eq('task_id', taskId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    return (data || []).map(offer => ({
      ...offer,
      tasker: offer.tasker as PartialUser
    }));
  },

  // Accept an offer
  async acceptOffer(offerId: string, taskId: string): Promise<void> {
    const { error: offerError } = await supabase
      .from('offers')
      .update({ status: 'accepted' })
      .eq('id', offerId);

    if (offerError) throw offerError;

    const { error: taskError } = await supabase
      .from('task_requests')
      .update({ 
        status: 'accepted',
        accepted_offer_id: offerId
      })
      .eq('id', taskId);

    if (taskError) throw taskError;

    // Reject other offers for this task
    const { error: rejectError } = await supabase
      .from('offers')
      .update({ status: 'rejected' })
      .eq('task_id', taskId)
      .neq('id', offerId);

    if (rejectError) throw rejectError;
  }
};

// Message API functions
export const messageAPI = {
  // Get messages for a task
  async getTaskMessages(taskId: string): Promise<Message[]> {
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:users!sender_id(id, name, profile_photo),
        receiver:users!receiver_id(id, name, profile_photo)
      `)
      .eq('task_id', taskId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    
    return (data || []).map(message => ({
      ...message,
      sender: message.sender as PartialUser,
      receiver: message.receiver as PartialUser
    }));
  },

  // Send a message
  async sendMessage(messageData: {
    task_id: string;
    receiver_id: string;
    message?: string;
    image_url?: string;
  }): Promise<Message> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('messages')
      .insert({
        sender_id: user.id,
        task_id: messageData.task_id,
        receiver_id: messageData.receiver_id,
        message: messageData.message,
        image_url: messageData.image_url
      })
      .select(`
        *,
        sender:users!sender_id(id, name, profile_photo),
        receiver:users!receiver_id(id, name, profile_photo)
      `)
      .single();

    if (error) throw error;
    
    return {
      ...data,
      sender: data.sender as PartialUser,
      receiver: data.receiver as PartialUser
    };
  }
};

// User API functions
export const userAPI = {
  // Get user profile
  async getUserProfile(userId: string): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  },

  // Update user profile
  async updateProfile(updates: Partial<User>): Promise<User> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Get approved taskers
  async getApprovedTaskers(): Promise<User[]> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'tasker')
      .eq('approved', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }
};
