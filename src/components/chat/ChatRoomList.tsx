
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw } from "lucide-react";

interface ChatRoom {
  id: string;
  taskTitle: string;
  participantName: string;
  participantId: string;
  status: 'active' | 'closed';
  unreadCount?: number;
}

interface ChatRoomListProps {
  chatRooms: ChatRoom[];
  selectedChat: string | null;
  loading: boolean;
  onSelectChat: (chatId: string) => void;
  onRefresh: () => void;
}

export const ChatRoomList = ({ 
  chatRooms, 
  selectedChat, 
  loading, 
  onSelectChat, 
  onRefresh 
}: ChatRoomListProps) => {
  return (
    <Card className="shadow-lg border-0 h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-blue-900">Conversations</CardTitle>
            <CardDescription>Your active chats</CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={onRefresh} disabled={loading}>
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
                onClick={() => onSelectChat(room.id)}
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
  );
};
