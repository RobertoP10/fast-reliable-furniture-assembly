
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, DollarSign, MessageSquare, Users } from "lucide-react";

interface Task {
  id: string;
  title: string;
  description: string;
  category: string;
  budget: { min: number; max: number };
  status: 'pending' | 'accepted' | 'completed' | 'closed';
  location: string;
  createdAt: Date;
  offers?: number;
}

interface TasksListProps {
  tasks: Task[];
  userRole: 'client' | 'tasker';
}

const TasksList = ({ tasks, userRole }: TasksListProps) => {
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: "În așteptare", className: "bg-yellow-100 text-yellow-700" },
      accepted: { label: "Acceptat", className: "bg-blue-100 text-blue-700" },
      completed: { label: "Finalizat", className: "bg-green-100 text-green-700" },
      closed: { label: "Închis", className: "bg-gray-100 text-gray-700" }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig];
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('ro-RO', {
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
          {userRole === 'client' ? 'Task-urile mele' : 'Task-uri disponibile'}
        </h2>
        {userRole === 'client' && (
          <Badge className="bg-blue-100 text-blue-700">
            {tasks.length} task-uri
          </Badge>
        )}
      </div>

      {tasks.length === 0 ? (
        <Card className="shadow-lg border-0">
          <CardContent className="py-12 text-center">
            <p className="text-gray-500">
              {userRole === 'client' 
                ? 'Nu ai încă niciun task. Creează primul tău task!' 
                : 'Nu sunt task-uri disponibile în zona ta momentan.'
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
                    <span>{task.budget.min} - {task.budget.max} RON</span>
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

                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-4">
                    <Badge variant="outline" className="text-blue-700">
                      {task.category}
                    </Badge>
                    {task.offers && task.offers > 0 && (
                      <div className="flex items-center space-x-1 text-sm text-gray-600">
                        <Users className="h-4 w-4" />
                        <span>{task.offers} oferte</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex space-x-2">
                    {userRole === 'tasker' && task.status === 'pending' && (
                      <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                        Trimite ofertă
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
                        Vezi oferte ({task.offers})
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
