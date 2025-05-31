
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { Wrench, Plus, MessageSquare, Bell, User, LogOut, Star } from "lucide-react";
import CreateTaskForm from "@/components/tasks/CreateTaskForm";
import TasksList from "@/components/tasks/TasksList";
import Chat from "@/components/chat/Chat";
import { useToast } from "@/hooks/use-toast";

const ClientDashboard = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'tasks' | 'create' | 'chat'>('tasks');
  const { toast } = useToast();

  const mockTasks = [
    {
      id: '1',
      title: 'Assemble IKEA PAX wardrobe',
      description: 'Need help assembling a PAX wardrobe from IKEA',
      category: 'Wardrobe',
      budget: { min: 100, max: 180 },
      status: 'pending' as const,
      location: 'Birmingham, UK',
      createdAt: new Date(),
      offers: 3,
      availableTaskers: [
        {
          id: 't1',
          name: 'John Smith',
          rating: 4.9,
          completedTasks: 45,
          price: 120
        },
        {
          id: 't2',
          name: 'Sarah Johnson',
          rating: 4.7,
          completedTasks: 32,
          price: 150
        },
        {
          id: 't3',
          name: 'Mike Williams',
          rating: 4.8,
          completedTasks: 28,
          price: 130
        }
      ]
    },
    {
      id: '2', 
      title: 'Assemble office desk',
      description: 'Office desk with drawers',
      category: 'Desk',
      budget: { min: 60, max: 100 },
      status: 'accepted' as const,
      location: 'Birmingham, UK',
      createdAt: new Date(),
      offers: 1,
      selectedTasker: {
        id: 't1',
        name: 'John Smith',
        rating: 4.9,
        completedTasks: 45,
        price: 80
      }
    }
  ];

  const handleSelectTasker = (taskId: string, tasker: any) => {
    toast({
      title: "Tasker selected!",
      description: `You have selected ${tasker.name} for this task.`,
    });
    console.log("Selected tasker:", tasker, "for task:", taskId);
  };

  const handleCancelTask = (taskId: string) => {
    toast({
      title: "Task cancelled",
      description: "The task has been cancelled successfully.",
    });
    console.log("Cancelled task:", taskId);
  };

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
                  My tasks
                </Button>
                <Button
                  variant={activeTab === 'create' ? 'default' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setActiveTab('create')}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create new task
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
                  <Badge className="bg-blue-100 text-blue-700">2</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Completed tasks</span>
                  <Badge className="bg-green-100 text-green-700">8</Badge>
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
            {activeTab === 'tasks' && (
              <TasksList 
                tasks={mockTasks} 
                userRole="client" 
                onSelectTasker={handleSelectTasker}
                onCancelTask={handleCancelTask}
              />
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
