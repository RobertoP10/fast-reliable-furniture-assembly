
import { useState, useEffect } from "react";
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
import { supabase } from "@/integrations/supabase/client";

const TaskerDashboard = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'available' | 'appointments' | 'my-offers' | 'completed' | 'chat'>('available');
  const [selectedChatTask, setSelectedChatTask] = useState<{ taskId: string; clientId: string } | null>(null);
  const [profileStats, setProfileStats] = useState({
    rating: 0,
    totalReviews: 0,
    monthlyEarnings: 0
  });
  const { unreadCount, refreshNotifications } = useNotifications();

  const fetchProfileStats = async () => {
    if (!user?.id) return;

    try {
      // Fetch updated user profile
      const { data: profile } = await supabase
        .from('users')
        .select('rating, total_reviews')
        .eq('id', user.id)
        .single();

      // Calculate monthly earnings from completed tasks - fix the query structure
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      
      const { data: completedTasks } = await supabase
        .from('task_requests')
        .select(`
          id,
          accepted_offer_id,
          completed_at
        `)
        .eq('status', 'completed')
        .gte('completed_at', new Date(currentYear, currentMonth, 1).toISOString())
        .lt('completed_at', new Date(currentYear, currentMonth + 1, 1).toISOString());

      let monthlyEarnings = 0;
      
      if (completedTasks) {
        // For each completed task, get the accepted offer price if the current user was the tasker
        for (const task of completedTasks) {
          if (task.accepted_offer_id) {
            const { data: offer } = await supabase
              .from('offers')
              .select('price, tasker_id')
              .eq('id', task.accepted_offer_id)
              .eq('tasker_id', user.id)
              .single();
            
            if (offer) {
              monthlyEarnings += Number(offer.price) || 0;
            }
          }
        }
      }

      setProfileStats({
        rating: profile?.rating || 0,
        totalReviews: profile?.total_reviews || 0,
        monthlyEarnings
      });
    } catch (error) {
      console.error('Error fetching profile stats:', error);
    }
  };

  useEffect(() => {
    fetchProfileStats();
  }, [user?.id]);

  const handleNotificationClick = () => {
    // Redirect to chat and refresh notifications
    setActiveTab('chat');
    refreshNotifications();
  };

  const handleChatWithClient = (taskId: string, clientId: string) => {
    setSelectedChatTask({ taskId, clientId });
    setActiveTab('chat');
  };

  const handleTaskUpdate = () => {
    // Refresh profile stats when tasks are updated
    fetchProfileStats();
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
                      <span className="text-sm font-medium">{profileStats.rating.toFixed(1)}</span>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total reviews</span>
                    <Badge className="bg-green-100 text-green-700">{profileStats.totalReviews}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">This month earnings</span>
                    <div className="flex items-center space-x-1">
                      <PoundSterling className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium">£{profileStats.monthlyEarnings.toFixed(2)}</span>
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
                  onTaskUpdate={handleTaskUpdate}
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
