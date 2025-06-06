


import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { Wrench, Plus, MessageSquare, Bell, User, LogOut, Star } from "lucide-react";
import CreateTaskForm from "@/components/tasks/CreateTaskForm";
import TasksList from "@/components/tasks/TasksList";
import Chat from "@/components/chat/Chat";
import { fetchTasks, acceptOffer } from "@/lib/api";

// Define the type locally to match what we'll get from fetching tasks with offers
type TaskWithOffers = {
  id: string;
  title: string;
  description: string;
  location: string;
  status: string;
  offers?: {
    id: string;
    price: number;
    proposed_date: string;
    proposed_time: string;
    created_at: string;
    is_accepted: boolean;
    message: string;
    task_id: string;
    tasker_id: string;
    updated_at: string;
    tasker?: {
      full_name: string;
    };
  }[];
};

const ClientDashboard = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'tasks' | 'create' | 'chat'>('tasks');
  const [tasksWithOffers, setTasksWithOffers] = useState<TaskWithOffers[]>([]);

  const loadTasksWithOffers = async () => {
    if (!user?.id) return;
    try {
      const result = await fetchTasks();
      // Filter to only show tasks owned by this client that have offers
      const clientTasks = result.filter(task => 
        task.client_id === user.id && 
        task.offers && 
        task.offers.length > 0
      );
      setTasksWithOffers(clientTasks);
    } catch (error) {
      console.error("Error loading tasks with offers:", error);
    }
  };

  const handleAccept = async (offerId: string) => {
    try {
      await acceptOffer(offerId);
      loadTasksWithOffers();
    } catch (error) {
      console.error("Failed to accept offer:", error);
    }
  };

  useEffect(() => {
    if (user?.id) loadTasksWithOffers();
  }, [user]);

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
          {/* Sidebar */}
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

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {activeTab === 'tasks' && <TasksList userRole="client" />}
            {activeTab === 'create' && <CreateTaskForm />}
            {activeTab === 'chat' && <Chat />}

            {/* Offers List for client */}
            {activeTab === 'tasks' && tasksWithOffers.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-blue-800">Offers Received</h3>
                {tasksWithOffers.map((task) => (
                  <Card key={task.id} className="border border-blue-100 shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-blue-900">{task.title}</CardTitle>
                      <CardDescription>{task.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {task.offers?.map((offer) => (
                        <div key={offer.id} className="border-l-4 border-blue-200 pl-4 space-y-2">
                          <div className="text-sm">
                            <div>Tasker: <strong>{offer.tasker?.full_name || 'Unknown'}</strong></div>
                            <div>Proposed: £{offer.price} on {offer.proposed_date} at {offer.proposed_time}</div>
                            {offer.message && <div>Message: {offer.message}</div>}
                          </div>
                          {!offer.is_accepted && (
                            <Button size="sm" onClick={() => handleAccept(offer.id)}>
                              Accept Offer
                            </Button>
                          )}
                          {offer.is_accepted && (
                            <Badge variant="default" className="bg-green-100 text-green-700">
                              Accepted
                            </Badge>
                          )}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientDashboard;


