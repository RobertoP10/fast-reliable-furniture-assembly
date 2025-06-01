
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Wrench, Bell, User, LogOut, Star, DollarSign, CheckCircle } from "lucide-react";
import TasksList from "@/components/tasks/TasksList";
import Chat from "@/components/chat/Chat";

interface Task {
  id: string;
  description: string;
  category: string;
  subcategory?: string;
  price_range: string;
  status: string;
  location: string;
  created_at: string;
  image_url?: string;
}

const TaskerDashboard = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'available' | 'my-tasks' | 'chat'>('available');
  const [availableTasks, setAvailableTasks] = useState<Task[]>([]);
  const [myTasks, setMyTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchAvailableTasks();
      fetchMyTasks();
    }
  }, [user]);

  const fetchAvailableTasks = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('task_requests')
        .select('*')
        .eq('status', 'pending')
        .neq('client_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching available tasks:', error);
        return;
      }

      setAvailableTasks(data || []);
    } catch (error) {
      console.error('Error fetching available tasks:', error);
    }
  };

  const fetchMyTasks = async () => {
    if (!user) return;
    
    try {
      // Fetch tasks where this user has offers or is assigned
      const { data, error } = await supabase
        .from('offers')
        .select(`
          *,
          task_requests (*)
        `)
        .eq('tasker_id', user.id);

      if (error) {
        console.error('Error fetching my tasks:', error);
        return;
      }

      const tasks = data?.map(offer => offer.task_requests).filter(Boolean) || [];
      setMyTasks(tasks);
    } catch (error) {
      console.error('Error fetching my tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <Wrench className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
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
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="h-4 w-4" />
                <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full"></span>
              </Button>
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium">{user?.name}</span>
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
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle className="text-blue-900">Tasker Dashboard</CardTitle>
                <CardDescription>Welcome, {user?.name}!</CardDescription>
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
                  variant={activeTab === 'my-tasks' ? 'default' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setActiveTab('my-tasks')}
                >
                  My Tasks
                </Button>
                <Button
                  variant={activeTab === 'chat' ? 'default' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setActiveTab('chat')}
                >
                  Chat
                </Button>
              </CardContent>
            </Card>

            {/* Profile Stats */}
            <Card className="shadow-lg border-0 mt-6">
              <CardHeader>
                <CardTitle className="text-blue-900 text-lg">My Profile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Rating</span>
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    <span className="text-sm font-medium">4.8</span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Completed tasks</span>
                  <Badge className="bg-green-100 text-green-700">
                    {myTasks.filter(t => t.status === 'completed').length}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">This month earnings</span>
                  <div className="flex items-center space-x-1">
                    <DollarSign className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium">£1,450</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Status</span>
                  <div className="flex items-center space-x-1">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-600">Verified</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {activeTab === 'available' && <TasksList tasks={availableTasks} userRole="tasker" />}
            {activeTab === 'my-tasks' && <TasksList tasks={myTasks} userRole="tasker" />}
            {activeTab === 'chat' && <Chat />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskerDashboard;
