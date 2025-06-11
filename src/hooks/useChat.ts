
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { fetchChatRooms, fetchMessages, sendMessage, markMessagesAsRead } from "@/lib/chat";

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
  sender_name?: string;
}

interface ChatRoom {
  id: string;
  task_title: string;
  client_name: string;
  tasker_name: string;
  client_id: string;
  tasker_id: string;
  unread_count: number;
}

export const useChat = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);

  // Load chat rooms when component mounts
  useEffect(() => {
    if (user?.id) {
      loadChatRooms();
    }
  }, [user?.id]);

  // Load messages when chat is selected
  useEffect(() => {
    if (selectedChat && user?.id) {
      loadMessages(selectedChat);
    }
  }, [selectedChat, user?.id]);

  const loadChatRooms = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      console.log('🔄 [CHAT] Loading chat rooms for user:', user.id);
      const rooms = await fetchChatRooms(user.id);
      
      setChatRooms(rooms);
      console.log('✅ [CHAT] Loaded chat rooms:', rooms.length);
    } catch (error) {
      console.error('❌ [CHAT] Error loading chat rooms:', error);
      toast({
        title: "Error",
        description: `Failed to load chat rooms: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (taskId: string) => {
    if (!user?.id) return;

    setLoadingMessages(true);
    try {
      console.log('🔄 [CHAT] Loading messages for task:', taskId);
      const taskMessages = await fetchMessages(taskId, user.id);
      setMessages(taskMessages);
      
      // Mark messages as read
      await markMessagesAsRead(taskId, user.id);
      
      // Update the chat room's unread count to 0
      setChatRooms(prev => prev.map(room => 
        room.id === taskId ? { ...room, unread_count: 0 } : room
      ));
      
      console.log('✅ [CHAT] Loaded messages:', taskMessages.length);
    } catch (error) {
      console.error('❌ [CHAT] Error loading messages:', error);
      toast({
        title: "Error",
        description: `Failed to load messages: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedChat || !user?.id) return;
    
    const selectedRoom = chatRooms.find(room => room.id === selectedChat);
    if (!selectedRoom) return;

    // Determine receiver ID based on current user
    const receiverId = user.id === selectedRoom.client_id ? selectedRoom.tasker_id : selectedRoom.client_id;

    try {
      console.log('📤 [CHAT] Sending message to task:', selectedChat);
      
      const sentMessage = await sendMessage(
        selectedChat,
        user.id,
        receiverId,
        newMessage.trim()
      );
      
      // Add the new message to the current messages
      setMessages(prev => [...prev, sentMessage]);
      setNewMessage("");
      
      toast({
        title: "Message sent",
        description: "Your message has been delivered.",
      });
    } catch (error) {
      console.error('❌ [CHAT] Error sending message:', error);
      toast({
        title: "Error",
        description: `Failed to send message: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    }
  };

  return {
    selectedChat,
    setSelectedChat,
    newMessage,
    setNewMessage,
    chatRooms,
    messages,
    loading,
    loadingMessages,
    loadChatRooms,
    handleSendMessage,
    user
  };
};
