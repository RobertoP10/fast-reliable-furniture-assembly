
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, User, RefreshCw } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { fetchChatRooms, fetchMessages, sendMessage, markMessagesAsRead } from "@/lib/api";

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
  sender?: {
    full_name: string;
  };
}

interface ChatRoom {
  id: string;
  taskTitle: string;
  participantName: string;
  participantId: string;
  status: 'active' | 'closed';
  unreadCount?: number;
}

const Chat = () => {
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
      const taskMessages = await fetchMessages(taskId);
      setMessages(taskMessages);
      
      // Mark messages as read
      await markMessagesAsRead(taskId, user.id);
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

    try {
      console.log('📤 [CHAT] Sending message to task:', selectedChat);
      const messageData = {
        task_id: selectedChat,
        sender_id: user.id,
        receiver_id: selectedRoom.participantId,
        content: newMessage.trim()
      };

      const sentMessage = await sendMessage(messageData);
      
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

  const formatMessageTime = (dateString: string) => {
    return new Intl.DateTimeFormat('en-GB', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString));
  };

  const selectedRoom = chatRooms.find(room => room.id === selectedChat);

  return (
    <div className="grid lg:grid-cols-3 gap-6 h-[600px]">
      {/* Chat List */}
      <div className="lg:col-span-1">
        <Card className="shadow-lg border-0 h-full">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-blue-900">Conversations</CardTitle>
                <CardDescription>Your active chats</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={loadChatRooms} disabled={loading}>
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-4 text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-sm text-gray-600">Loading chats...</p>
              </div>
            ) : chatRooms.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <p className="text-sm">No active conversations</p>
                <p className="text-xs mt-1">Accept a task offer to start chatting</p>
              </div>
            ) : (
              <div className="space-y-1">
                {chatRooms.map((room) => (
                  <div
                    key={room.id}
                    className={`p-4 border-b cursor-pointer hover:bg-blue-50 transition-colors ${
                      selectedChat === room.id ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''
                    }`}
                    onClick={() => setSelectedChat(room.id)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-sm text-blue-900 truncate">
                        {room.taskTitle}
                      </h4>
                      {room.unreadCount && room.unreadCount > 0 && (
                        <Badge className="bg-red-500 text-white text-xs">
                          {room.unreadCount}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 mb-1">{room.participantName}</p>
                    <Badge 
                      className={`mt-2 text-xs ${
                        room.status === 'active' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {room.status === 'active' ? 'Active' : 'Closed'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Chat Messages */}
      <div className="lg:col-span-2">
        <Card className="shadow-lg border-0 h-full flex flex-col">
          {selectedChat && selectedRoom ? (
            <>
              <CardHeader className="border-b">
                <div className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarImage src="" />
                    <AvatarFallback>
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-blue-900 text-lg">
                      {selectedRoom.participantName}
                    </CardTitle>
                    <CardDescription className="text-sm">
                      {selectedRoom.taskTitle}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="flex-1 p-4 overflow-y-auto">
                {loadingMessages ? (
                  <div className="flex justify-center items-center h-full">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex justify-center items-center h-full text-gray-500">
                    <p>No messages yet. Start the conversation!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((message) => {
                      const isOwn = message.sender_id === user?.id;
                      return (
                        <div
                          key={message.id}
                          className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                              isOwn
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-900'
                            }`}
                          >
                            <p className="text-sm">{message.content}</p>
                            <p className={`text-xs mt-1 ${
                              isOwn ? 'text-blue-100' : 'text-gray-500'
                            }`}>
                              {formatMessageTime(message.created_at)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>

              <div className="border-t p-4">
                <div className="flex space-x-2">
                  <Input
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    className="flex-1"
                  />
                  <Button onClick={handleSendMessage} className="bg-blue-600 hover:bg-blue-700">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <CardContent className="flex-1 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <p>Select a conversation to start chatting</p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Chat;
