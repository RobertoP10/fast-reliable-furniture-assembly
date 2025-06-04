import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, DollarSign, MessageSquare, Users, Star } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { fetchTasks, fetchUserOffers } from "@/lib/api";
import type { Database } from '@/integrations/supabase/types';
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

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

  const [locationFilter, setLocationFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [completedCount, setCompletedCount] = useState(0);
  const [completedTotal, setCompletedTotal] = useState(0);

  const loadData = async () => {
    if (!user) return;

    setLoading(true);

    try {
      if (propTasks) {
        setTasks(propTasks);
      } else if (userRole === 'tasker') {
        if (activeTab === 'my-tasks') {
          const offers = await fetchUserOffers(user.id);
          setUserOffers(offers);
          setTasks([]);
        } else {
          const data = await fetchTasks(userRole, user.id, {
            location: locationFilter,
            status: activeTab === 'completed' ? 'completed' : undefined
          });
          setTasks(data);

          if (activeTab === 'completed') {
            const count = data.length;
            const total = data.reduce((acc, t) => acc + (t.accepted_offer?.price || 0), 0);
            setCompletedCount(count);
            setCompletedTotal(total);
          }
        }
      } else {
        const data = await fetchTasks(userRole, user.id);
        setTasks(data);
      }
    } catch (err) {
      console.error("❌ Error loading tasks:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user, userRole, propTasks, activeTab, locationFilter, statusFilter]);

  const formatDate = (dateString: string) =>
    new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString));

  const getStatusBadge = (status: string) => {
    const map: any = {
      pending: "bg-yellow-100 text-yellow-700",
      accepted: "bg-blue-100 text-blue-700",
      in_progress: "bg-purple-100 text-purple-700",
      completed: "bg-green-100 text-green-700",
      cancelled: "bg-gray-100 text-gray-700"
    };
    return <Badge className={map[status] || "bg-gray-200"}>{status}</Badge>;
  };

  const renderTaskerTabs = () =>
    userRole === 'tasker' && (
      <div className="flex space-x-2 mb-4">
        <Button onClick={() => setActiveTab('available')} variant={activeTab === 'available' ? 'default' : 'outline'}>Available</Button>
        <Button onClick={() => setActiveTab('my-tasks')} variant={activeTab === 'my-tasks' ? 'default' : 'outline'}>My Offers</Button>
        <Button onClick={() => setActiveTab('completed')} variant={activeTab === 'completed' ? 'default' : 'outline'}>Completed</Button>
      </div>
    );

  const renderFilters = () =>
    userRole === 'tasker' && activeTab !== 'my-tasks' && (
      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <Input placeholder="Filter by location..." value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)} />
        <Select onValueChange={(value) => setStatusFilter(value === "all" ? undefined : value)} defaultValue="all">
          <SelectTrigger>
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="accepted">Accepted</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>
    );

  const renderCompletedSummary = () =>
    userRole === 'tasker' && activeTab === 'completed' && (
      <div className="mb-4 space-x-4">
        <Badge className="bg-green-100 text-green-700">Completed: {completedCount}</Badge>
        <Badge className="bg-blue-100 text-blue-700">Total £: {completedTotal}</Badge>
      </div>
    );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-blue-900">Tasks</h2>
        {userRole === 'client' && <Badge>{tasks.length} tasks</Badge>}
      </div>

      {renderTaskerTabs()}
      {renderFilters()}
      {renderCompletedSummary()}

      {userRole === 'tasker' && activeTab === 'my-tasks' ? (
        userOffers.length === 0 ? (
          <p>No offers yet.</p>
        ) : (
          userOffers.map((offer) => (
            <Card key={offer.id}>
              <CardHeader>
                <CardTitle>{offer.task?.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p>{offer.task?.description}</p>
                <p>Offer: £{offer.price}</p>
                <p>Status: {getStatusBadge(offer.task?.status)}</p>
              </CardContent>
            </Card>
          ))
        )
      ) : (
        tasks.length === 0 ? (
          <p>No tasks found.</p>
        ) : (
          tasks.map((task) => (
            <Card key={task.id}>
              <CardHeader className="flex justify-between">
                <div>
                  <CardTitle>{task.title}</CardTitle>
                  <p className="text-sm text-gray-500">{task.description}</p>
                </div>
                {getStatusBadge(task.status)}
              </CardHeader>
              <CardContent>
                <p><DollarSign className="inline w-4 h-4" /> {task.price_range_min}–{task.price_range_max}</p>
                <p><MapPin className="inline w-4 h-4" /> {task.location}</p>
                <p><Clock className="inline w-4 h-4" /> {formatDate(task.created_at)}</p>
              </CardContent>
            </Card>
          ))
        )
      )}
    </div>
  );
};

export default TasksList;
