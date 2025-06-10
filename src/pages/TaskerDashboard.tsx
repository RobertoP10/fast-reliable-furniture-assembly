
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { Wrench, Bell, User, LogOut, Star, PoundSterling, CheckCircle, Calendar } from "lucide-react";
import TasksList from "@/components/tasks/TasksList";
import Chat from "@/components/chat/Chat";
import RoleProtection from "@/components/auth/RoleProtection";
import { NotificationBadge } from "@/components/ui/notification-badge";
import { useNotifications } from "@/hooks/useNotifications";

const TaskerDashboard = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'available' | 'appointments' | 'my-offers' | 'completed' | 'chat'>('available');
  const [selectedChatTask, setSelectedChatTask] = useState<{ taskId: string; clientId: string } | null>(null);
  const { unreadCount, refreshNotifications } = useNotifications();

  const handleNotificationClick = () => {
    // Redirect to chat and refresh notifications
    setActiveTab('chat');
    refreshNotifications();
  };

  const handleChatWithClient = (taskId: string, clientId: string) => {
    setSelectedChatTask({ taskId, clientId });
    setActiveTab('chat');
  };

  if (!user?.approved) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center px-4">
        <Card className="w-full max-w-md shadow-xl border-0">
          <CardHeader className="text-center">
            <Wrench className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <CardTitle className="text-blue-900">Account Pending Approval</CardTitle>
            <CardDescription>
              Your tasker account is under review. You will receive a notification when it's approved.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={logout} variant="outline" className="w-full">
              Logout
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getTabMapping = () => {
    switch (activeTab) {
      case 'available': return 'available';
      case 'my-offers': return 'my-tasks';
      case 'appointments': return 'appointments';
      case 'completed': return 'completed';
      default: return 'available';
    }
  };

  return (
    <RoleProtection allowedRoles={['tasker']}>
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
                <NotificationBadge count={unreadCount} onClick={handleNotificationClick} />
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-gray-600" />
                  <span className="text-sm font-medium">{user?.full_name}</span>
                  <Badge className="bg-green-100 text-green-700">Tasker</Badge>
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
                  <CardTitle className="text-blue-900">Tasker Dashboard</CardTitle>
                  <CardDescription>Welcome, {user?.full_name}!</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    variant={activeTab === 'available' ? 'default' : 'ghost'}
                    className="w-full justify-start"
                    onClick={() => setActiveTab('available')}
                  >
                    Available Tasks
                  </Button>
                  <Button
                    variant={activeTab === 'my-offers' ? 'default' : 'ghost'}
                    className="w-full justify-start"
                    onClick={() => setActiveTab('my-offers')}
                  >
                    My Offers
                  </Button>
                  <Button
                    variant={activeTab === 'appointments' ? 'default' : 'ghost'}
                    className="w-full justify-start"
                    onClick={() => setActiveTab('appointments')}
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Appointments
                  </Button>
                  <Button
                    variant={activeTab === 'completed' ? 'default' : 'ghost'}
                    className="w-full justify-start"
                    onClick={() => setActiveTab('completed')}
                  >
                    Completed Tasks
                  </Button>
                  <Button
                    variant={activeTab === 'chat' ? 'default' : 'ghost'}
                    className="w-full justify-start"
                    onClick={() => setActiveTab('chat')}
                  >
                    Chat
                    {unreadCount > 0 && (
                      <Badge className="ml-2 bg-red-500 text-white text-xs">
                        {unreadCount}
                      </Badge>
                    )}
                  </Button>
                </CardContent>
              </Card>

              <Card className="shadow-lg border-0 mt-6">
                <CardHeader>
                  <CardTitle className="text-blue-900 text-lg">My Profile</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Rating</span>
                    <div className="flex items-center space-x-1">
                      <Star className="h-4 w-4 text-yellow-500 fill-current" />
                      <span className="text-sm font-medium">{user?.rating || 0}</span>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total reviews</span>
                    <Badge className="bg-green-100 text-green-700">{user?.total_reviews || 0}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">This month earnings</span>
                    <div className="flex items-center space-x-1">
                      <PoundSterling className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium">£0</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Status</span>
                    <div className="flex items-center space-x-1">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-600">
                        {user?.approved ? 'Verified' : 'Pending'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-3">
              {activeTab === 'chat' ? (
                <Chat selectedTaskId={selectedChatTask?.taskId} />
              ) : (
                <TasksList 
                  userRole="tasker" 
                  activeTab={getTabMapping()}
                  onChatWithClient={handleChatWithClient}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </RoleProtection>
  );
};

export default TaskerDashboard;
