
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuthContext } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, MapPin, DollarSign, User } from "lucide-react";

interface Task {
  id: string;
  title: string;
  description: string;
  category: string;
  subcategory: string;
  price_range: string;
  location: string;
  status: string;
  payment_method: string;
  created_at: string;
  client_id: string;
  users: {
    name: string;
  };
}

const TaskerTasksList = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthContext();

  useEffect(() => {
    if (user) {
      fetchAvailableTasks();
    }
  }, [user]);

  const fetchAvailableTasks = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('task_requests')
        .select(`
          *,
          users!task_requests_client_id_fkey (
            name
          )
        `)
        .eq('status', 'pending')
        .neq('client_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching tasks:', error);
        return;
      }

      // Map the data to match our Task interface
      const mappedTasks: Task[] = (data || []).map(task => ({
        id: task.id,
        title: task.title || 'Untitled Task',
        description: task.description || '',
        category: task.category || '',
        subcategory: task.subcategory || '',
        price_range: task.price_range || '',
        location: task.location || '',
        status: task.status || 'pending',
        payment_method: task.payment_method || 'cash',
        created_at: task.created_at || new Date().toISOString(),
        client_id: task.client_id,
        users: task.users || { name: 'Anonymous' }
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

  const handleMakeOffer = async (taskId: string) => {
    // This would open a modal or form to make an offer
    console.log('Making offer for task:', taskId);
  };

  if (loading) {
    return (
      <Card className="shadow-lg border-0">
        <CardHeader>
          <CardTitle className="text-blue-900">Available Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading available tasks...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (tasks.length === 0) {
    return (
      <Card className="shadow-lg border-0">
        <CardHeader>
          <CardTitle className="text-blue-900">Available Tasks</CardTitle>
          <CardDescription>
            Tasks available for bidding will appear here
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">No tasks available at the moment.</p>
            <p className="text-sm text-gray-500">Check back later for new opportunities!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg border-0">
      <CardHeader>
        <CardTitle className="text-blue-900">Available Tasks</CardTitle>
        <CardDescription>
          Browse and bid on tasks in your area
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {tasks.map((task) => (
            <div key={task.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-semibold text-gray-900">{task.title}</h3>
                <Badge className="bg-green-100 text-green-700">Available</Badge>
              </div>
              
              <p className="text-gray-600 text-sm mb-3 line-clamp-2">{task.description}</p>
              
              <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-3">
                <div className="flex items-center space-x-1">
                  <User className="h-4 w-4" />
                  <span>{task.users?.name || 'Anonymous'}</span>
                </div>
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
              
              <div className="flex justify-between items-center">
                <div className="flex gap-2">
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
                
                <Button 
                  size="sm" 
                  onClick={() => handleMakeOffer(task.id)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Make Offer
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default TaskerTasksList;
