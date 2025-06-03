
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, DollarSign, MessageSquare, Users } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { fetchTasks, fetchUserOffers } from "@/lib/api";
import type { Database } from '@/integrations/supabase/types';

type TaskRequest = Database['public']['Tables']['task_requests']['Row'];

interface TasksListProps {
  userRole: 'client' | 'tasker';
  tasks?: TaskRequest[];
}

const TasksList = ({ userRole, tasks: propTasks }: TasksListProps) => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<TaskRequest[]>([]);
  const [userOffers, setUserOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'available' | 'my-tasks'>('available');

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      
      if (propTasks) {
        setTasks(propTasks);
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        
        if (userRole === 'tasker' && activeTab === 'available') {
          // Load available tasks for taskers
          const taskData = await fetchTasks(userRole, user.id);
          setTasks(taskData);
        } else if (userRole === 'tasker' && activeTab === 'my-tasks') {
          // Load user's offers and their associated tasks
          const offers = await fetchUserOffers(user.id);
          setUserOffers(offers);
          setTasks([]); // Clear tasks when showing offers
        } else {
          // Load tasks for clients
          const taskData = await fetchTasks(userRole, user.id);
          setTasks(taskData);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user, userRole, propTasks, activeTab]);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: "Pending", className: "bg-yellow-100 text-yellow-700" },
      accepted: { label: "Accepted", className: "bg-blue-100 text-blue-700" },
      in_progress: { label: "In Progress", className: "bg-purple-100 text-purple-700" },
      completed: { label: "Completed", className: "bg-green-100 text-green-700" },
      cancelled: { label: "Cancelled", className: "bg-gray-100 text-gray-700" }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig];
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-blue-900">
            {userRole === 'client' ? 'My Tasks' : activeTab === 'available' ? 'Available Tasks' : 'My Tasks'}
          </h2>
        </div>
        <Card className="shadow-lg border-0">
          <CardContent className="py-12 text-center">
            <p className="text-gray-500">Loading...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const renderTaskerTabs = () => {
    if (userRole !== 'tasker') return null;

    return (
      <div className="flex space-x-2 mb-6">
        <Button
          variant={activeTab === 'available' ? 'default' : 'outline'}
          onClick={() => setActiveTab('available')}
        >
          Available Tasks
        </Button>
        <Button
          variant={activeTab === 'my-tasks' ? 'default' : 'outline'}
          onClick={() => setActiveTab('my-tasks')}
        >
          My Offers
        </Button>
      </div>
    );
  };

  const renderUserOffers = () => {
    if (userOffers.length === 0) {
      return (
        <Card className="shadow-lg border-0">
          <CardContent className="py-12 text-center">
            <p className="text-gray-500">You haven't made any offers yet.</p>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="grid gap-6">
        {userOffers.map((offer) => (
          <Card key={offer.id} className="shadow-lg border-0 hover:shadow-xl transition-all duration-300">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="text-blue-900 mb-2">{offer.task?.title || 'Task'}</CardTitle>
                  <CardDescription className="text-gray-600">
                    {offer.task?.description || 'No description'}
                  </CardDescription>
                </div>
                <div className="flex flex-col items-end space-y-2">
                  {getStatusBadge(offer.task?.status || 'pending')}
                  <Badge variant={offer.is_accepted ? 'default' : 'outline'}>
                    {offer.is_accepted ? 'Accepted' : 'Pending'}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4 mb-4">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <DollarSign className="h-4 w-4" />
                  <span>Your Offer: £{offer.price}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <MapPin className="h-4 w-4" />
                  <span>{offer.task?.location || 'No location'}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Clock className="h-4 w-4" />
                  <span>{formatDate(offer.created_at)}</span>
                </div>
              </div>

              {offer.message && (
                <div className="mb-4 p-3 bg-gray-50 rounded">
                  <p className="text-sm text-gray-700">"{offer.message}"</p>
                </div>
              )}

              <div className="flex justify-between items-center">
                <Badge variant="outline" className="text-blue-700">
                  Offer Status: {offer.is_accepted ? 'Accepted' : 'Pending'}
                </Badge>
                
                {offer.is_accepted && (
                  <Button size="sm" variant="outline">
                    <MessageSquare className="h-4 w-4 mr-1" />
                    Chat
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-blue-900">
          {userRole === 'client' ? 'My Tasks' : 
           activeTab === 'available' ? 'Available Tasks' : 'My Offers'}
        </h2>
        {userRole === 'client' && (
          <Badge className="bg-blue-100 text-blue-700">
            {tasks.length} tasks
          </Badge>
        )}
      </div>

      {renderTaskerTabs()}

      {userRole === 'tasker' && activeTab === 'my-tasks' ? renderUserOffers() : (
        tasks.length === 0 ? (
          <Card className="shadow-lg border-0">
            <CardContent className="py-12 text-center">
              <p className="text-gray-500">
                {userRole === 'client' 
                  ? 'You don\'t have any tasks yet. Create your first task!' 
                  : 'No tasks available in your area at the moment.'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {tasks.map((task) => (
              <Card key={task.id} className="shadow-lg border-0 hover:shadow-xl transition-all duration-300">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-blue-900 mb-2">{task.title}</CardTitle>
                      <CardDescription className="text-gray-600">
                        {task.description}
                      </CardDescription>
                    </div>
                    {getStatusBadge(task.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-4 mb-4">
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <DollarSign className="h-4 w-4" />
                      <span>£{task.price_range_min} - £{task.price_range_max}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <MapPin className="h-4 w-4" />
                      <span>{task.location}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Clock className="h-4 w-4" />
                      <span>{formatDate(task.created_at)}</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-4">
                      <Badge variant="outline" className="text-blue-700">
                        {task.category}
                      </Badge>
                    </div>
                    
                    <div className="flex space-x-2">
                      {userRole === 'tasker' && task.status === 'pending' && (
                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                          Send Offer
                        </Button>
                      )}
                      {userRole === 'client' && (task.status === 'accepted' || task.status === 'completed') && (
                        <Button size="sm" variant="outline">
                          <MessageSquare className="h-4 w-4 mr-1" />
                          Chat
                        </Button>
                      )}
                      {userRole === 'client' && task.status === 'pending' && (
                        <Button size="sm" variant="outline">
                          View Offers
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )
      )}
    </div>
  );
};

export default TasksList;
