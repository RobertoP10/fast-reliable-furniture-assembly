
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, DollarSign, MessageSquare, Users, X } from "lucide-react";

interface Tasker {
  id: string;
  name: string;
  rating: number;
  completedTasks: number;
  price: number;
}

interface Task {
  id: string;
  title: string;
  description: string;
  category: string;
  budget: { min: number; max: number };
  status: 'pending' | 'accepted' | 'completed' | 'closed' | 'cancelled';
  location: string;
  createdAt: Date;
  offers?: number;
  availableTaskers?: Tasker[];
  selectedTasker?: Tasker;
}

interface TasksListProps {
  tasks: Task[];
  userRole: 'client' | 'tasker';
  onSelectTasker?: (taskId: string, tasker: Tasker) => void;
  onCancelTask?: (taskId: string) => void;
}

const TasksList = ({ tasks, userRole, onSelectTasker, onCancelTask }: TasksListProps) => {
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: "Pending", className: "bg-yellow-100 text-yellow-700" },
      accepted: { label: "Accepted", className: "bg-blue-100 text-blue-700" },
      completed: { label: "Completed", className: "bg-green-100 text-green-700" },
      closed: { label: "Closed", className: "bg-gray-100 text-gray-700" },
      cancelled: { label: "Cancelled", className: "bg-red-100 text-red-700" }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig];
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-blue-900">
          {userRole === 'client' ? 'My tasks' : 'Available tasks'}
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
                    <span>£{task.budget.min} - £{task.budget.max}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <MapPin className="h-4 w-4" />
                    <span>{task.location}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Clock className="h-4 w-4" />
                    <span>{formatDate(task.createdAt)}</span>
                  </div>
                </div>

                {task.selectedTasker && (
                  <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm font-medium text-blue-900">
                      Selected Tasker: {task.selectedTasker.name}
                    </p>
                    <p className="text-sm text-blue-700">
                      Rating: {task.selectedTasker.rating}⭐ • {task.selectedTasker.completedTasks} completed tasks • £{task.selectedTasker.price}
                    </p>
                  </div>
                )}

                {userRole === 'client' && task.status === 'pending' && task.availableTaskers && task.availableTaskers.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Choose your tasker:</h4>
                    <div className="space-y-2">
                      {task.availableTaskers.map((tasker) => (
                        <div key={tasker.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">{tasker.name}</p>
                            <p className="text-sm text-gray-600">
                              {tasker.rating}⭐ • {tasker.completedTasks} completed tasks
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">£{tasker.price}</span>
                            <Button 
                              size="sm" 
                              onClick={() => onSelectTasker?.(task.id, tasker)}
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              Select
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-4">
                    <Badge variant="outline" className="text-blue-700">
                      {task.category}
                    </Badge>
                    {task.offers && task.offers > 0 && !task.availableTaskers && (
                      <div className="flex items-center space-x-1 text-sm text-gray-600">
                        <Users className="h-4 w-4" />
                        <span>{task.offers} offers</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex space-x-2">
                    {userRole === 'tasker' && task.status === 'pending' && (
                      <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                        Send offer
                      </Button>
                    )}
                    {userRole === 'client' && (task.status === 'accepted' || task.status === 'completed') && (
                      <Button size="sm" variant="outline">
                        <MessageSquare className="h-4 w-4 mr-1" />
                        Chat
                      </Button>
                    )}
                    {(task.status === 'pending' || task.status === 'accepted') && (
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => onCancelTask?.(task.id)}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default TasksList;
