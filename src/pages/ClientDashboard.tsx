
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Wrench, Plus, MessageSquare, Bell, User, LogOut, Star } from "lucide-react";
import CreateTaskForm from "@/components/tasks/CreateTaskForm";
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

const ClientDashboard = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'tasks' | 'create' | 'chat'>('tasks');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserTasks();
    }
  }, [user]);

  const fetchUserTasks = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('task_requests')
        .select('*')
        .eq('client_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching tasks:', error);
        return;
      }

      setTasks(data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTaskCreated = () => {
    fetchUserTasks();
    setActiveTab('tasks');
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
                <CardTitle className="text-blue-900">Client Dashboard</CardTitle>
                <CardDescription>Welcome, {user?.name}!</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant={activeTab === 'tasks' ? 'default' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setActiveTab('tasks')}
                >
                  My Tasks
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

            {/* Stats Card */}
            <Card className="shadow-lg border-0 mt-6">
              <CardHeader>
                <CardTitle className="text-blue-900 text-lg">Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Active tasks</span>
                  <Badge className="bg-blue-100 text-blue-700">
                    {tasks.filter(t => t.status === 'pending' || t.status === 'accepted').length}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Completed tasks</span>
                  <Badge className="bg-green-100 text-green-700">
                    {tasks.filter(t => t.status === 'completed').length}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Average rating</span>
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    <span className="text-sm font-medium">4.9</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {activeTab === 'tasks' && <TasksList tasks={tasks} userRole="client" />}
            {activeTab === 'create' && <CreateTaskForm onTaskCreated={handleTaskCreated} />}
            {activeTab === 'chat' && <Chat />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientDashboard;
