import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuthContext } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, MapPin, DollarSign } from "lucide-react";

interface Task {
  id: string;
  client_id: string;
  title: string;
  description: string;
  category: string;
  subcategory: string;
  price_range: string;
  location: string;
  status: string;
  payment_method: string;
  image_url: string;
  created_at: string;
}

const ClientTasksList = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthContext();

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
        .select('id, client_id, title, description, category, subcategory, price_range, location, status, payment_method, image_url, created_at')
        .eq('client_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching tasks:', error);
        return;
      }

      // Map the data to match our Task interface
      const mappedTasks: Task[] = (data || []).map(task => ({
        id: task.id,
        client_id: task.client_id,
        title: task.title || 'Untitled Task',
        description: task.description || '',
        category: task.category || '',
        subcategory: task.subcategory || '',
        price_range: task.price_range || '',
        location: task.location || '',
        status: task.status || 'pending',
        payment_method: task.payment_method || 'cash',
        image_url: task.image_url || '',
        created_at: task.created_at || new Date().toISOString()
      }));

      setTasks(mappedTasks);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'in_progress':
        return 'bg-blue-100 text-blue-700';
      case 'completed':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return (
      <Card className="shadow-lg border-0">
        <CardHeader>
          <CardTitle className="text-blue-900">Your Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your tasks...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (tasks.length === 0) {
    return (
      <Card className="shadow-lg border-0">
        <CardHeader>
          <CardTitle className="text-blue-900">Your Tasks</CardTitle>
          <CardDescription>
            Tasks you've posted will appear here
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">You haven't posted any tasks yet.</p>
            <p className="text-sm text-gray-500">Create your first task to get started!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg border-0">
      <CardHeader>
        <CardTitle className="text-blue-900">Your Tasks</CardTitle>
        <CardDescription>
          Manage and track your posted tasks
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {tasks.map((task) => (
            <div key={task.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-semibold text-gray-900">{task.title}</h3>
                <Badge className={getStatusColor(task.status)}>
                  {task.status.replace('_', ' ')}
                </Badge>
              </div>
              
              <p className="text-gray-600 text-sm mb-3 line-clamp-2">{task.description}</p>
              
              <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                <div className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDate(task.created_at)}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <MapPin className="h-4 w-4" />
                  <span>{task.location}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <DollarSign className="h-4 w-4" />
                  <span>{task.price_range}</span>
                </div>
              </div>
              
              <div className="flex gap-2 mt-3">
                <Badge variant="outline" className="text-xs">
                  {task.category}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {task.subcategory}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {task.payment_method}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ClientTasksList;
