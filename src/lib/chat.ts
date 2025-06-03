
import { supabase } from "@/integrations/supabase/client";

// Chat functions - Fixed to properly handle relationships
export const fetchChatRooms = async (userId: string): Promise<any[]> => {
  console.log('🔍 [CHAT] Fetching chat rooms for user:', userId);
  
  try {
    // Get tasks where user is involved and has accepted offers
    const { data: tasks, error: tasksError } = await supabase
      .from('task_requests')
      .select(`
        id,
        title,
        client_id,
        status,
        accepted_offer_id
      `)
      .or(`client_id.eq.${userId}`)
      .not('accepted_offer_id', 'is', null);

    if (tasksError) {
      console.error('❌ [CHAT] Error fetching client tasks:', tasksError);
      throw new Error(`Failed to fetch chat rooms: ${tasksError.message}`);
    }

    // Get tasks where user is the tasker with accepted offer
    const { data: taskerTasks, error: taskerError } = await supabase
      .from('offers')
      .select(`
        task_id,
        task:task_requests!offers_task_id_fkey(
          id,
          title,
          client_id,
          status
        )
      `)
      .eq('tasker_id', userId)
      .eq('is_accepted', true);

    if (taskerError) {
      console.error('❌ [CHAT] Error fetching tasker tasks:', taskerError);
      throw new Error(`Failed to fetch tasker chat rooms: ${taskerError.message}`);
    }

    const chatRooms = [];

    // Add client chat rooms
    for (const task of tasks || []) {
      if (task.accepted_offer_id) {
        // Get the accepted offer details
        const { data: offer } = await supabase
          .from('offers')
          .select(`
            tasker_id,
            tasker:users!offers_tasker_id_fkey(full_name)
          `)
          .eq('id', task.accepted_offer_id)
          .single();

        if (offer) {
          chatRooms.push({
            id: task.id,
            taskTitle: task.title,
            participantName: offer.tasker?.full_name || 'Tasker',
            participantId: offer.tasker_id,
            status: task.status === 'completed' ? 'closed' : 'active'
          });
        }
      }
    }

    // Add tasker chat rooms
    for (const item of taskerTasks || []) {
      if (item.task) {
        // Get client details
        const { data: client } = await supabase
          .from('users')
          .select('full_name')
          .eq('id', item.task.client_id)
          .single();

        chatRooms.push({
          id: item.task.id,
          taskTitle: item.task.title,
          participantName: client?.full_name || 'Client',
          participantId: item.task.client_id,
          status: item.task.status === 'completed' ? 'closed' : 'active'
        });
      }
    }

    console.log('✅ [CHAT] Chat rooms fetched successfully:', chatRooms.length, 'rooms');
    return chatRooms;
  } catch (error) {
    console.error('❌ [CHAT] Exception in fetchChatRooms:', error);
    throw error;
  }
};

export const fetchMessages = async (taskId: string): Promise<any[]> => {
  console.log('🔍 [CHAT] Fetching messages for task:', taskId);
  
  const { data, error } = await supabase
    .from('messages')
    .select(`
      *,
      sender:users!messages_sender_id_fkey(full_name)
    `)
    .eq('task_id', taskId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('❌ [CHAT] Error fetching messages:', error);
    throw new Error(`Failed to fetch messages: ${error.message}`);
  }

  console.log('✅ [CHAT] Messages fetched successfully:', data?.length || 0, 'messages');
  return data || [];
};

export const sendMessage = async (messageData: {
  task_id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
}): Promise<any> => {
  console.log('📝 [CHAT] Sending message for task:', messageData.task_id);
  
  const { data, error } = await supabase
    .from('messages')
    .insert({
      task_id: messageData.task_id,
      sender_id: messageData.sender_id,
      receiver_id: messageData.receiver_id,
      content: messageData.content,
      is_read: false
    })
    .select(`
      *,
      sender:users!messages_sender_id_fkey(full_name)
    `)
    .single();

  if (error) {
    console.error('❌ [CHAT] Error sending message:', error);
    throw new Error(`Failed to send message: ${error.message}`);
  }

  console.log('✅ [CHAT] Message sent successfully with ID:', data.id);
  return data;
};

export const markMessagesAsRead = async (taskId: string, receiverId: string): Promise<void> => {
  console.log('📝 [CHAT] Marking messages as read for task:', taskId, 'receiver:', receiverId);
  
  const { error } = await supabase
    .from('messages')
    .update({ is_read: true })
    .eq('task_id', taskId)
    .eq('receiver_id', receiverId)
    .eq('is_read', false);

  if (error) {
    console.error('❌ [CHAT] Error marking messages as read:', error);
    throw new Error(`Failed to mark messages as read: ${error.message}`);
  }

  console.log('✅ [CHAT] Messages marked as read successfully');
};
