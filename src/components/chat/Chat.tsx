
import React, { useEffect, useRef } from "react";
import { ChatRoomList } from "./ChatRoomList";
import { ChatMessages } from "./ChatMessages";
import { MessageInput } from "./MessageInput";
import { useChat } from "@/hooks/useChat";

interface ChatProps {
  selectedTaskId?: string;
}

const Chat = ({ selectedTaskId }: ChatProps) => {
  const {
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
  } = useChat();

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-select chat if selectedTaskId is provided
  useEffect(() => {
    if (selectedTaskId && chatRooms.length > 0) {
      const targetRoom = chatRooms.find(room => room.id === selectedTaskId);
      if (targetRoom) {
        setSelectedChat(selectedTaskId);
      }
    }
  }, [selectedTaskId, chatRooms, setSelectedChat]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const selectedRoom = chatRooms.find(room => room.id === selectedChat);

  return (
    <div className="grid lg:grid-cols-3 gap-6 h-[600px]">
      {/* Chat List */}
      <div className="lg:col-span-1">
        <ChatRoomList
          chatRooms={chatRooms}
          selectedChat={selectedChat}
          loading={loading}
          onSelectChat={setSelectedChat}
          onRefresh={loadChatRooms}
        />
      </div>

      {/* Chat Messages */}
      <div className="lg:col-span-2">
        <div className="h-full flex flex-col">
          <div className="flex-1 relative">
            <ChatMessages
              selectedRoom={selectedRoom}
              messages={messages}
              loadingMessages={loadingMessages}
              currentUserId={user?.id}
            />
            <div ref={messagesEndRef} />
          </div>
          {selectedChat && selectedRoom && (
            <MessageInput
              newMessage={newMessage}
              onMessageChange={setNewMessage}
              onSendMessage={handleSendMessage}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Chat;
