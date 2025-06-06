import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import {
  Wrench,
  Plus,
  MessageSquare,
  Bell,
  User,
  LogOut,
  Star,
} from "lucide-react";
import CreateTaskForm from "@/components/tasks/CreateTaskForm";
import Chat from "@/components/chat/Chat";
import { fetchTasks, acceptOffer } from "@/lib/api";
import type { Database } from "@/integrations/supabase/types";

const ClientDashboard = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'tasks' | 'create' | 'chat'>('tasks');
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadOffers = async () => {
    try {
      const data = await fetchTasks(user!.id, "client");
      setTasks(data);
    } catch (err) {
      console.error("Error loading offers:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'tasks') {
      loadOffers();
    }
  }, [activeTab]);

  const handleAccept = async (offerId: string, taskId: string) => {
    try {
      await acceptOffer(offerId, taskId);
      loadOffers();
    } catch (err) {
      console.error("Failed to accept offer:", err);
    }
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
          <div className="lg:col-span-3">
            {activeTab === 'tasks' && (
              loading ? (
                <p>Loading offers...</p>
              ) : (
                <div className="space-y-6">
                  {tasks.map((task) => (
                    <Card key={task.id}>
                      <CardHeader>
                        <CardTitle>{task.title}</CardTitle>
                        <CardDescription>{task.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {task.offers && task.offers.length > 0 ? (
                          <div className="space-y-4">
                            {task.offers.map((offer: any) => (
                              <div key={offer.id} className="border p-4 rounded shadow-sm">
                                <p><strong>Price:</strong> £{offer.price}</p>
                                <p><strong>Date:</strong> {offer.proposed_date}</p>
                                <p><strong>Time:</strong> {offer.proposed_time}</p>
                                <p><strong>Message:</strong> {offer.message || "—"}</p>
                                <p><strong>Status:</strong> {offer.is_accepted ? "✅ Accepted" : "Pending"}</p>
                                {!offer.is_accepted && (
                                  <Button onClick={() => handleAccept(offer.id, task.id)} className="mt-2">
                                    Accept Offer
                                  </Button>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-500">No offers received yet.</p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )
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
