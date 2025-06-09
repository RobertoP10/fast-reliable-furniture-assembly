
import { ChatRoomList } from "./ChatRoomList";
import { ChatMessages } from "./ChatMessages";
import { MessageInput } from "./MessageInput";
import { useChat } from "@/hooks/useChat";

const Chat = () => {
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
          <div className="flex-1">
            <ChatMessages
              selectedRoom={selectedRoom}
              messages={messages}
              loadingMessages={loadingMessages}
              currentUserId={user?.id}
            />
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
