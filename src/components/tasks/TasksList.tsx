import { useEffect, useState } from "react";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, PoundSterling } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { fetchTasks, acceptOffer } from "@/lib/api";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import MakeOfferDialog from "@/components/tasks/MakeOfferDialog";
import type { Database } from "@/integrations/supabase/types";

type Offer = Database["public"]["Tables"]["offers"]["Row"];
type TaskRow = Database["public"]["Tables"]["task_requests"]["Row"];

// Updated Task type to match what we actually get from the API
type Task = TaskRow & {
  offers?: Offer[];
  accepted_offer_id?: string | null;
  client?: {
    full_name: string;
    location: string;
  };
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
          task.location?.toLowerCase().includes(locationFilter.toLowerCase())
        );
      }

      if (statusFilter !== "all") {
        filteredTasks = filteredTasks.filter(task => task.status === statusFilter);
      }

      if (userRole === "tasker") {
        if (activeTab === "available") {
          filteredTasks = fetchedTasks.filter(task =>
            task.status === "pending" &&
            !(task.offers && task.offers.some((offer) => offer.tasker_id === user.id))
          );
        } else if (activeTab === "my-tasks") {
          filteredTasks = fetchedTasks.filter(task =>
            task.offers?.some((offer) => offer.tasker_id === user.id)
          );
        } else if (activeTab === "completed") {
          filteredTasks = fetchedTasks.filter(task => task.status === "completed");
        }
      } else if (userRole === "client") {
        if (activeTab === "available") {
          filteredTasks = fetchedTasks.filter(task => task.status === "pending");
        } else if (activeTab === "my-tasks") {
          filteredTasks = fetchedTasks.filter(task => task.status === "accepted");
        } else if (activeTab === "completed") {
          filteredTasks = fetchedTasks.filter(task => task.status === "completed");
        }
      }

      if (activeTab === "completed") {
        const total = filteredTasks.reduce((sum, task) => {
          // Find the accepted offer price from the offers array
          const acceptedOffer = task.offers?.find(offer => offer.id === task.accepted_offer_id);
          if (acceptedOffer?.price) {
            return sum + acceptedOffer.price;
          }
          return sum;
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

  const handleOfferCreated = () => {
    setSelectedTaskId(null);
    loadData();
  };

  const handleAcceptOffer = async (taskId: string, offerId: string) => {
    const res = await acceptOffer(taskId, offerId);
    if (res.success) {
      loadData();
    } else {
      console.error("❌ Failed to accept offer:", res.error);
    }
  };

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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-blue-900">
          {activeTab === "completed"
            ? "Completed Tasks"
            : userRole === "client"
            ? "My Tasks"
            : activeTab === "my-tasks"
            ? "My Offers"
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
          {tasks.map(task => {
            const hasOffered = task.offers?.some((offer) => offer.tasker_id === user.id);
            const myOffer = task.offers?.find((offer) => offer.tasker_id === user.id);

            return (
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
                  <div className="grid md:grid-cols-3 gap-4 mb-4 text-sm text-gray-600">
                    <div className="flex items-center space-x-2">
                      <PoundSterling className="h-4 w-4" />
                      <span>£{task.price_range_min} – £{task.price_range_max}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4" />
                      <span>{task.location}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4" />
                      <span>{new Date(task.created_at).toLocaleString()}</span>
                    </div>
                  </div>

                  {userRole === "tasker" && activeTab === "available" && (
                    hasOffered ? (
                      <Badge>You already sent an offer</Badge>
                    ) : (
                      <Button onClick={() => setSelectedTaskId(task.id)}>
                        Make an Offer
                      </Button>
                    )
                  )}

                  {userRole === "tasker" && activeTab === "my-tasks" && myOffer && (
                    <div className="text-sm text-gray-700 mt-2">
                      Your Offer: <strong>£{myOffer.price}</strong> – Status: <strong>
                        {myOffer.is_accepted === true
                          ? "Accepted"
                          : myOffer.is_accepted === false
                          ? "Rejected"
                          : "Pending"}
                      </strong>
                    </div>
                  )}

                  {userRole === "client" && task.offers?.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <h4 className="font-semibold">Received Offers:</h4>
                      {task.offers.map((offer) => (
                        <div key={offer.id} className="border p-3 rounded shadow-sm">
                          <p>Tasker ID: {offer.tasker_id}</p>
                          <p>Price: £{offer.price}</p>
                          <p>Message: {offer.message}</p>
                          <p>Status: <strong>{offer.is_accepted ? "Accepted" : "Pending"}</strong></p>
                          {!offer.is_accepted && (
                            <Button
                              className="mt-2"
                              onClick={() => handleAcceptOffer(task.id, offer.id)}
                            >
                              Accept Offer
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
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
