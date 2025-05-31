
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, User } from "lucide-react";

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  message: string;
  timestamp: Date;
  isOwn: boolean;
}

interface ChatRoom {
  id: string;
  taskTitle: string;
  participantName: string;
  lastMessage: string;
  unreadCount: number;
  status: 'active' | 'closed';
}

const Chat = () => {
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");

  const mockChatRooms: ChatRoom[] = [
    {
      id: '1',
      taskTitle: 'Asamblare dulap IKEA PAX',
      participantName: 'Ion Popescu',
      lastMessage: 'Când putem programa întâlnirea?',
      unreadCount: 2,
      status: 'active'
    },
    {
      id: '2',
      taskTitle: 'Asamblare birou',
      participantName: 'Maria Ionescu',
      lastMessage: 'Am terminat asamblarea. Vă trimit poze.',
      unreadCount: 0,
      status: 'closed'
    }
  ];

  const mockMessages: Message[] = [
    {
      id: '1',
      senderId: 'tasker1',
      senderName: 'Ion Popescu',
      message: 'Bună ziua! Am văzut cererea dumneavoastră pentru asamblarea dulap-ului PAX.',
      timestamp: new Date(Date.now() - 3600000),
      isOwn: false
    },
    {
      id: '2',
      senderId: 'client1',
      senderName: 'Tu',
      message: 'Bună! Da, am nevoie de ajutor cu asamblarea.',
      timestamp: new Date(Date.now() - 3000000),
      isOwn: true
    },
    {
      id: '3',
      senderId: 'tasker1',
      senderName: 'Ion Popescu',
      message: 'Perfect! Când putem programa întâlnirea? Sunt disponibil mâine după-amiaza.',
      timestamp: new Date(Date.now() - 1800000),
      isOwn: false
    }
  ];

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    
    console.log("Sending message:", newMessage);
    setNewMessage("");
  };

  const formatMessageTime = (date: Date) => {
    return new Intl.DateTimeFormat('ro-RO', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="grid lg:grid-cols-3 gap-6 h-[600px]">
      {/* Chat List */}
      <div className="lg:col-span-1">
        <Card className="shadow-lg border-0 h-full">
          <CardHeader>
            <CardTitle className="text-blue-900">Conversații</CardTitle>
            <CardDescription>Chat-urile tale active</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="space-y-1">
              {mockChatRooms.map((room) => (
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
                    {room.unreadCount > 0 && (
                      <Badge className="bg-red-500 text-white text-xs">
                        {room.unreadCount}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 mb-1">{room.participantName}</p>
                  <p className="text-xs text-gray-500 truncate">{room.lastMessage}</p>
                  <Badge 
                    className={`mt-2 text-xs ${
                      room.status === 'active' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {room.status === 'active' ? 'Activ' : 'Închis'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chat Messages */}
      <div className="lg:col-span-2">
        <Card className="shadow-lg border-0 h-full flex flex-col">
          {selectedChat ? (
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
                      {mockChatRooms.find(r => r.id === selectedChat)?.participantName}
                    </CardTitle>
                    <CardDescription className="text-sm">
                      {mockChatRooms.find(r => r.id === selectedChat)?.taskTitle}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="flex-1 p-4 overflow-y-auto">
                <div className="space-y-4">
                  {mockMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.isOwn ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.isOwn
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <p className="text-sm">{message.message}</p>
                        <p className={`text-xs mt-1 ${
                          message.isOwn ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                          {formatMessageTime(message.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>

              <div className="border-t p-4">
                <div className="flex space-x-2">
                  <Input
                    placeholder="Scrie un mesaj..."
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
                <p>Selectează o conversație pentru a începe chat-ul</p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Chat;
