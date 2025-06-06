import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, PoundSterling } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { fetchTasks } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import MakeOfferDialog from "@/components/tasks/MakeOfferDialog";
import type { Database } from "@/integrations/supabase/types";

type Offer = Database["public"]["Tables"]["offers"]["Row"];
type Task = Database["public"]["Tables"]["task_requests"]["Row"] & {
  offers?: Offer[];
};

interface TasksListProps {
  userRole: "client" | "tasker";
  tasks?: Task[];
}

const TasksList = ({ userRole, tasks: propTasks }: TasksListProps) => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"available" | "my-tasks" | "completed">("available");
  const [locationFilter, setLocationFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [completedCount, setCompletedCount] = useState(0);
  const [completedTotal, setCompletedTotal] = useState(0);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const loadData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const fetchedTasks = await fetchTasks(user.id, userRole);

      let filteredTasks = fetchedTasks;
      if (locationFilter) {
        filteredTasks = filteredTasks.filter(task =>
          task.location.toLowerCase().includes(locationFilter.toLowerCase())
        );
      }
      if (statusFilter !== "all") {
        filteredTasks = filteredTasks.filter(task => task.status === statusFilter);
      }

      if (activeTab === "available") {
        filteredTasks = filteredTasks.filter(task =>
          task.status === "pending" &&
          !task.offers?.some((offer) => offer.tasker_id === user.id)
        );
      } else if (activeTab === "my-tasks") {
        filteredTasks = filteredTasks.filter(task =>
          task.offers?.some((offer) => offer.tasker_id === user.id)
        );
      } else if (activeTab === "completed") {
        filteredTasks = filteredTasks.filter(task => task.status === "completed");
        const total = filteredTasks.reduce((sum, task) => {
          return sum + (task.price_range_max || 0);
        }, 0);
        setCompletedCount(filteredTasks.length);
        setCompletedTotal(total);
      }

      setTasks(filteredTasks);
    } catch (error) {
      console.error("❌ Error loading tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!propTasks) {
      loadData();
    } else {
      setTasks(propTasks);
      setLoading(false);
    }
  }, [user, activeTab, locationFilter, statusFilter]);

  const getStatusBadge = (status: string) => {
    const map: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-700",
      accepted: "bg-blue-100 text-blue-700",
      in_progress: "bg-purple-100 text-purple-700",
      completed: "bg-green-100 text-green-700",
      cancelled: "bg-gray-100 text-gray-700",
    };
    return <Badge className={map[status] || "bg-gray-100 text-gray-700"}>{status}</Badge>;
  };

  const handleOfferCreated = () => {
    setSelectedTaskId(null);
    loadData();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-blue-900">
          {activeTab === "completed"
            ? "Completed Tasks"
            : userRole === "client"
            ? "My Tasks"
            : "Available Tasks"}
        </h2>
        {userRole === "tasker" && (
          <div className="space-x-2">
            <Button variant={activeTab === "available" ? "default" : "outline"} onClick={() => setActiveTab("available")}>
              Available
            </Button>
            <Button variant={activeTab === "my-tasks" ? "default" : "outline"} onClick={() => setActiveTab("my-tasks")}>
              My Offers
            </Button>
            <Button variant={activeTab === "completed" ? "default" : "outline"} onClick={() => setActiveTab("completed")}>
              Completed
            </Button>
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <Input
          placeholder="Filter by location"
          value={locationFilter}
          onChange={(e) => setLocationFilter(e.target.value)}
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="accepted">Accepted</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {activeTab === "completed" && (
        <div className="flex justify-between text-sm text-gray-600">
          <span>Total tasks: <strong>{completedCount}</strong></span>
          <span>Total value: <strong>£{completedTotal.toFixed(2)}</strong></span>
        </div>
      )}

      {loading ? (
        <Card><CardContent className="text-center py-8">Loading...</CardContent></Card>
      ) : tasks.length === 0 ? (
        <Card><CardContent className="text-center py-8">No tasks found.</CardContent></Card>
      ) : (
        <div className="grid gap-6">
          {tasks.map(task => (
            <Card key={task.id} className="shadow-lg border-0 hover:shadow-xl transition-all duration-300">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-blue-900 mb-2">{task.title}</CardTitle>
                    <CardDescription>{task.description}</CardDescription>
                  </div>
                  {getStatusBadge(task.status)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4 mb-4">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <PoundSterling className="h-4 w-4" />
                    <span>£{task.price_range_min} – £{task.price_range_max}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <MapPin className="h-4 w-4" />
                    <span>{task.location}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Clock className="h-4 w-4" />
                    <span>{new Date(task.created_at).toLocaleString()}</span>
                  </div>
                </div>
                {userRole === "tasker" && activeTab === "available" && (
                  <Button onClick={() => setSelectedTaskId(task.id)}>
                    Make an Offer
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {selectedTaskId && (
        <MakeOfferDialog
          taskId={selectedTaskId}
          onOfferCreated={handleOfferCreated}
        />
      )}
    </div>
  );
};

export default TasksList;
