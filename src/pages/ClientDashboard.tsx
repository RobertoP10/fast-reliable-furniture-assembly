
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { Wrench, Plus, MessageSquare, User, LogOut, Star } from "lucide-react";
import CreateTaskForm from "@/components/tasks/CreateTaskForm";
import TasksList from "@/components/tasks/TasksList";
import Chat from "@/components/chat/Chat";
import { NotificationBadge } from "@/components/ui/notification-badge";
import { useNotifications } from "@/hooks/useNotifications";

const ClientDashboard = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'tasks' | 'received-offers' | 'appointments' | 'completed' | 'create' | 'chat'>('tasks');
  const { unreadCount, refreshNotifications } = useNotifications();

  // Refresh notifications when tab changes to chat
  useEffect(() => {
    if (activeTab === 'chat') {
      refreshNotifications();
    }
  }, [activeTab, refreshNotifications]);

  const getTasksActiveTab = () => {
    switch (activeTab) {
      case 'tasks':
        return 'my-tasks';
      case 'received-offers':
        return 'received-offers';
      case 'appointments':
        return 'appointments';
      case 'completed':
        return 'completed';
      default:
        return 'my-tasks';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <header className="bg-white/80 backdrop-blur-md border-b border-blue-100 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Wrench className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                MGSDEAL
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <NotificationBadge count={unreadCount} />
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium">{user?.full_name}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={logout}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1">
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle className="text-blue-900">Client Dashboard</CardTitle>
                <CardDescription>Welcome, {user?.full_name}!</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant={activeTab === 'tasks' ? 'default' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setActiveTab('tasks')}
                >
                  My Requests
                </Button>
                <Button
                  variant={activeTab === 'received-offers' ? 'default' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setActiveTab('received-offers')}
                >
                  Received Offers
                </Button>
                <Button
                  variant={activeTab === 'appointments' ? 'default' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setActiveTab('appointments')}
                >
                  Accepted Tasks
                </Button>
                <Button
                  variant={activeTab === 'completed' ? 'default' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setActiveTab('completed')}
                >
                  Completed
                </Button>
                <Button
                  variant={activeTab === 'create' ? 'default' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setActiveTab('create')}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Task
                </Button>
                <Button
                  variant={activeTab === 'chat' ? 'default' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setActiveTab('chat')}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Chat
                </Button>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-0 mt-6">
              <CardHeader>
                <CardTitle className="text-blue-900 text-lg">Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Active tasks</span>
                  <Badge className="bg-blue-100 text-blue-700">-</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Completed tasks</span>
                  <Badge className="bg-green-100 text-green-700">-</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Average rating</span>
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    <span className="text-sm font-medium">0</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-3 space-y-6">
            {(activeTab === 'tasks' || activeTab === 'received-offers' || activeTab === 'appointments' || activeTab === 'completed') && (
              <TasksList userRole="client" activeTab={getTasksActiveTab()} />
            )}
            {activeTab === 'create' && <CreateTaskForm />}
            {activeTab === 'chat' && <Chat />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientDashboard;
