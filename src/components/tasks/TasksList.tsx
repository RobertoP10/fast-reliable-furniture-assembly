// TasksList.tsx
import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  MapPin,
  Clock,
  DollarSign,
  MessageSquare,
  Users,
  Star,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { fetchTasks, fetchUserOffers } from "@/lib/api";
import type { Database } from '@/integrations/supabase/types';

// Types

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
  const [activeTab, setActiveTab] = useState<'available' | 'my-tasks' | 'completed'>('available');

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

        if (userRole === 'tasker') {
          if (activeTab === 'available' || activeTab === 'completed') {
            const taskData = await fetchTasks(user.id, userRole, user.location, activeTab);
            setTasks(taskData);
          } else if (activeTab === 'my-tasks') {
            const offers = await fetchUserOffers(user.id);
            setUserOffers(offers);
            setTasks([]);
          }
        } else {
          const taskData = await fetchTasks(user.id, userRole);
          setTasks(taskData);
        }
      } catch (error) {
        console.error('Error loading tasks:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user, userRole, propTasks, activeTab]);

  const totalCompleted = tasks.filter(t => t.status === 'completed');
  const totalCompletedValue = totalCompleted.reduce((sum, t) => sum + (t.accepted_offer_id ? t.price_range_max || 0 : 0), 0);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: "Pending", className: "bg-yellow-100 text-yellow-700" },
      accepted: { label: "Accepted", className: "bg-blue-100 text-blue-700" },
      in_progress: { label: "In Progress", className: "bg-purple-100 text-purple-700" },
      completed: { label: "Completed", className: "bg-green-100 text-green-700" },
      cancelled: { label: "Cancelled", className: "bg-gray-100 text-gray-700" },
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

  const renderTaskerTabs = () => {
    if (userRole !== 'tasker') return null;

    return (
      <div className="flex space-x-2 mb-6">
        <Button variant={activeTab === 'available' ? 'default' : 'outline'} onClick={() => setActiveTab('available')}>Available Tasks</Button>
        <Button variant={activeTab === 'my-tasks' ? 'default' : 'outline'} onClick={() => setActiveTab('my-tasks')}>My Offers</Button>
        <Button variant={activeTab === 'completed' ? 'default' : 'outline'} onClick={() => setActiveTab('completed')}>Completed</Button>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-blue-900">
          {userRole === 'client' ? 'My Tasks' :
            activeTab === 'available' ? 'Available Tasks' :
            activeTab === 'my-tasks' ? 'My Offers' :
            'Completed Tasks'}
        </h2>
        {activeTab === 'completed' && (
          <div className="flex flex-col text-right">
            <span className="text-sm text-gray-600">Total: {totalCompleted.length} tasks</span>
            <span className="text-sm font-bold text-green-700">£{totalCompletedValue.toFixed(2)}</span>
          </div>
        )}
      </div>

      {renderTaskerTabs()}

      {/* Afișare taskuri */}
      {tasks.length === 0 ? (
        <Card className="shadow-lg border-0">
          <CardContent className="py-12 text-center">
            <p className="text-gray-500">
              {userRole === 'client'
                ? "You don't have any tasks yet. Create your first task!"
                : "No tasks available in your area at the moment."}
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
                    <CardDescription className="text-gray-600">{task.description}</CardDescription>
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
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default TasksList;
