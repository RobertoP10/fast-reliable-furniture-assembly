
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, DollarSign, MessageSquare, Users } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { taskAPI } from "@/lib/api";
import type { TaskRequest } from "@/types/database";

interface TasksListProps {
  userRole: 'client' | 'tasker';
}

const TasksList = ({ userRole }: TasksListProps) => {
  const [tasks, setTasks] = useState<TaskRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchTasks();
  }, [userRole, user]);

  const fetchTasks = async () => {
    if (!user) return;

    try {
      let data: TaskRequest[];
      
      if (userRole === 'client') {
        data = await taskAPI.getMyTasks();
      } else {
        // For taskers, show available tasks
        data = await taskAPI.getAvailableTasks();
      }

      setTasks(data);
    } catch (error: any) {
      console.error('Error fetching tasks:', error);
      toast({
        title: "Error",
        description: "Failed to load tasks. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

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

  const formatPrice = (priceInPence?: number) => {
    if (!priceInPence) return '0';
    return (priceInPence / 100).toFixed(0);
  };

  const getOffersCount = (task: TaskRequest): number => {
    if (Array.isArray(task.offers)) {
      return task.offers.length;
    }
    // Handle the case where offers is a count object from aggregation
    return (task.offers as any)?.[0]?.count || 0;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-blue-900">
            {userRole === 'client' ? 'My Tasks' : 'Available Tasks'}
          </h2>
        </div>
        <Card className="shadow-lg border-0">
          <CardContent className="py-12 text-center">
            <p className="text-gray-500">Loading tasks...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-blue-900">
          {userRole === 'client' ? 'My Tasks' : 'Available Tasks'}
        </h2>
        {userRole === 'client' && (
          <Badge className="bg-blue-100 text-blue-700">
            {tasks.length} tasks
          </Badge>
        )}
      </div>

      {tasks.length === 0 ? (
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
          {tasks.map((task) => {
            const offersCount = getOffersCount(task);
            
            return (
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
                      <span>
                        £{formatPrice(task.price_range_min)} - £{formatPrice(task.price_range_max)}
                      </span>
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
                        {task.subcategory && ` - ${task.subcategory}`}
                      </Badge>
                      {offersCount > 0 && (
                        <div className="flex items-center space-x-1 text-sm text-gray-600">
                          <Users className="h-4 w-4" />
                          <span>{offersCount} offers</span>
                        </div>
                      )}
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
                      {userRole === 'client' && task.status === 'pending' && offersCount > 0 && (
                        <Button size="sm" variant="outline">
                          View Offers ({offersCount})
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TasksList;
