import { supabase } from "@/integrations/supabase/client";
import { validateSession } from "./session-validator";

interface ChatRoom {
  id: string;
  task_id: string;
  client_id: string;
  tasker_id: string;
  task_title: string;
  client_name: string;
  tasker_name: string;
  last_message?: string;
  last_message_at?: string;
  unread_count: number;
}

interface Message {
  id: string;
  task_id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
  sender_name?: string;
}

export const fetchChatRooms = async (userId: string): Promise<ChatRoom[]> => {
  console.log("🔍 [CHAT] Fetching chat rooms for user:", userId);
  
  // Validate session
  const sessionValidation = await validateSession();
  if (!sessionValidation.isValid || !sessionValidation.userId) {
    console.error("❌ [CHAT] Session validation failed:", sessionValidation.error);
    throw new Error("Authentication required");
  }

  if (sessionValidation.userId !== userId) {
    console.error("❌ [CHAT] User ID mismatch");
    throw new Error("User ID mismatch");
  }

  try {
    // Get tasks where user is either client or has accepted offer as tasker
    const { data: tasks, error } = await supabase
      .from("task_requests")
      .select("id, title, client_id, accepted_offer_id, status")
      .eq("status", "accepted")
      .not("accepted_offer_id", "is", null);

    if (error) {
      console.error("❌ [CHAT] Error fetching chat tasks:", error);
      throw new Error(`Failed to fetch chat rooms: ${error.message}`);
    }

    const chatRooms: ChatRoom[] = [];

    for (const task of tasks || []) {
      // Get the accepted offer details
      const { data: acceptedOffer, error: offerError } = await supabase
        .from("offers")
        .select("tasker_id")
        .eq("id", task.accepted_offer_id)
        .single();

      if (offerError || !acceptedOffer) continue;

      // Check if user is involved in this task
      const isClient = task.client_id === userId;
      const isTasker = acceptedOffer.tasker_id === userId;
      
      if (!isClient && !isTasker) continue;

      // Get user names
      const partnerId = isClient ? acceptedOffer.tasker_id : task.client_id;
      const { data: partnerData } = await supabase
        .from("users")
        .select("full_name")
        .eq("id", partnerId)
        .single();

      const { data: clientData } = await supabase
        .from("users")
        .select("full_name")
        .eq("id", task.client_id)
        .single();

      const { data: taskerData } = await supabase
        .from("users")
        .select("full_name")
        .eq("id", acceptedOffer.tasker_id)
        .single();

      // Get last message and unread count
      const { data: lastMessage } = await supabase
        .from("messages")
        .select("content, created_at")
        .eq("task_id", task.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      const { count: unreadCount } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("task_id", task.id)
        .eq("receiver_id", userId)
        .eq("is_read", false);

      chatRooms.push({
        id: task.id, // Use task.id directly as the chat room ID
        task_id: task.id,
        client_id: task.client_id,
        tasker_id: acceptedOffer.tasker_id,
        task_title: task.title,
        client_name: clientData?.full_name || "Unknown Client",
        tasker_name: taskerData?.full_name || "Unknown Tasker",
        last_message: lastMessage?.content,
        last_message_at: lastMessage?.created_at,
        unread_count: unreadCount || 0,
      });
    }

    console.log("✅ [CHAT] Fetched chat rooms:", chatRooms.length);
    return chatRooms;
  } catch (error) {
    console.error("❌ [CHAT] Exception in fetchChatRooms:", error);
    throw error;
  }
};

const getUserOfferIds = async (userId: string): Promise<string> => {
  const { data } = await supabase
    .from("offers")
    .select("id")
    .eq("tasker_id", userId)
    .eq("is_accepted", true);
  
  return data?.map(offer => offer.id).join(",") || "''";
};

export const fetchMessages = async (taskId: string, userId: string): Promise<Message[]> => {
  console.log("🔍 [CHAT] Fetching messages for task:", taskId, "user:", userId);
  
  // Validate session
  const sessionValidation = await validateSession();
  if (!sessionValidation.isValid) {
    console.error("❌ [CHAT] Session validation failed:", sessionValidation.error);
    throw new Error("Authentication required");
  }

  try {
    const { data, error } = await supabase
      .from("messages")
      .select(`
        id,
        task_id,
        sender_id,
        receiver_id,
        content,
        is_read,
        created_at
      `)
      .eq("task_id", taskId)
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("❌ [CHAT] Error fetching messages:", error);
      throw new Error(`Failed to fetch messages: ${error.message}`);
    }

    // Get sender names separately
    const messages = await Promise.all((data || []).map(async (msg) => {
      const { data: senderData } = await supabase
        .from("users")
        .select("full_name")
        .eq("id", msg.sender_id)
        .single();
      
      return {
        ...msg,
        sender_name: senderData?.full_name || "Unknown User"
      };
    }));

    console.log("✅ [CHAT] Loaded messages:", messages.length);
    return messages;
  } catch (error) {
    console.error("❌ [CHAT] Exception in fetchMessages:", error);
    throw error;
  }
};

export const sendMessage = async (
  taskId: string,
  senderId: string,
  receiverId: string,
  content: string
): Promise<Message> => {
  console.log("🔄 [CHAT] Sending message:", { taskId, senderId, receiverId });
  
  // Validate session
  const sessionValidation = await validateSession();
  if (!sessionValidation.isValid) {
    console.error("❌ [CHAT] Session validation failed:", sessionValidation.error);
    throw new Error("Authentication required");
  }

  try {
    const { data, error } = await supabase
      .from("messages")
      .insert({
        task_id: taskId,
        sender_id: senderId,
        receiver_id: receiverId,
        content,
        is_read: false
      })
      .select()
      .single();

    if (error) {
      console.error("❌ [CHAT] Error sending message:", error);
      throw new Error(`Failed to send message: ${error.message}`);
    }

    // Get sender name
    const { data: senderData } = await supabase
      .from("users")
      .select("full_name")
      .eq("id", data.sender_id)
      .single();

    const message = {
      ...data,
      sender_name: senderData?.full_name || "Unknown User"
    };

    console.log("✅ [CHAT] Message sent:", message.id);
    return message;
  } catch (error) {
    console.error("❌ [CHAT] Exception in sendMessage:", error);
    throw error;
  }
};

export const markMessagesAsRead = async (taskId: string, userId: string): Promise<void> => {
  console.log("🔄 [CHAT] Marking messages as read for task:", taskId, "user:", userId);
  
  // Validate session
  const sessionValidation = await validateSession();
  if (!sessionValidation.isValid) {
    console.error("❌ [CHAT] Session validation failed:", sessionValidation.error);
    throw new Error("Authentication required");
  }

  try {
    const { error } = await supabase
      .from("messages")
      .update({ is_read: true })
      .eq("task_id", taskId)
      .eq("receiver_id", userId)
      .eq("is_read", false);

    if (error) {
      console.error("❌ [CHAT] Error marking messages as read:", error);
      throw new Error(`Failed to mark messages as read: ${error.message}`);
    }

    console.log("✅ [CHAT] Messages marked as read");
  } catch (error) {
    console.error("❌ [CHAT] Exception in markMessagesAsRead:", error);
    throw error;
  }
};
