import { useEffect, useState } from "react";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, PoundSterling } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { fetchTasks, acceptOffer } from "@/lib/tasks";
import MakeOfferDialog from "@/components/tasks/MakeOfferDialog";
import type { Database } from "@/integrations/supabase/types";

type Offer = Database["public"]["Tables"]["offers"]["Row"] & {
  tasker?: { full_name: string; approved?: boolean };
};

type Task = Database["public"]["Tables"]["task_requests"]["Row"] & {
  offers?: Offer[];
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
  const [activeTab, setActiveTab] = useState<"available" | "my-tasks" | "completed" | "received-offers">("available");
  const [completedCount, setCompletedCount] = useState(0);
  const [completedTotal, setCompletedTotal] = useState(0);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const loadData = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const fetchedTasks = await fetchTasks(user.id, userRole);
      let filteredTasks = fetchedTasks;

      if (userRole === "tasker") {
        if (activeTab === "available") {
          filteredTasks = fetchedTasks.filter(task =>
            task.status === "pending" &&
            !(task.offers?.some((o) => o.tasker_id === user.id))
          );
        } else if (activeTab === "my-tasks") {
          filteredTasks = fetchedTasks.filter(task =>
            task.offers?.some((o) => o.tasker_id === user.id)
          );
        } else if (activeTab === "completed") {
          filteredTasks = fetchedTasks.filter(task => task.status === "completed");
        }
      }

      if (userRole === "client") {
        if (activeTab === "available") {
          filteredTasks = fetchedTasks.filter(task => task.status === "pending");
        } else if (activeTab === "my-tasks") {
          filteredTasks = fetchedTasks.filter(task => task.status === "accepted");
        } else if (activeTab === "completed") {
          filteredTasks = fetchedTasks.filter(task => task.status === "completed");
        } else if (activeTab === "received-offers") {
          filteredTasks = fetchedTasks.filter(task =>
            task.status === "pending" && Array.isArray(task.offers) && task.offers.length > 0
          );
        }
      }

      if (activeTab === "completed") {
        const total = filteredTasks.reduce((sum, task) => {
          const accepted = task.offers?.find(o => o.is_accepted);
          return sum + (accepted?.price ?? 0);
        }, 0);
        setCompletedCount(filteredTasks.length);
        setCompletedTotal(total);
      }

      setTasks(filteredTasks);
    } catch (err) {
      console.error("❌ Failed to load tasks", err);
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
  }, [user, activeTab]);

  const handleAcceptOffer = async (taskId: string, offerId: string) => {
    const res = await acceptOffer(taskId, offerId);
    if (res.success) loadData();
  };

  const handleOfferCreated = () => {
    setSelectedTaskId(null);
    loadData();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-blue-900">
          {activeTab === "completed" ? "Completed Tasks"
            : activeTab === "my-tasks" ? (userRole === "client" ? "Accepted Tasks" : "My Offers")
            : activeTab === "received-offers" ? "Received Offers"
            : userRole === "client" ? "Pending Requests" : "Available Tasks"}
        </h2>
        <div className="space-x-2">
          <Button variant={activeTab === "available" ? "default" : "outline"} onClick={() => setActiveTab("available")}>
            {userRole === "client" ? "Pending Requests" : "Available"}
          </Button>
          <Button variant={activeTab === "my-tasks" ? "default" : "outline"} onClick={() => setActiveTab("my-tasks")}>
            {userRole === "client" ? "Accepted Tasks" : "My Offers"}
          </Button>
          <Button variant={activeTab === "completed" ? "default" : "outline"} onClick={() => setActiveTab("completed")}>
            Completed
          </Button>
          {userRole === "client" && (
            <Button variant={activeTab === "received-offers" ? "default" : "outline"} onClick={() => setActiveTab("received-offers")}>
              Received Offers
            </Button>
          )}
        </div>
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
            <TaskCard
              key={task.id}
              task={task}
              userRole={userRole}
              user={user}
              onAccept={handleAcceptOffer}
              onMakeOffer={() => setSelectedTaskId(task.id)}
            />
          ))}
        </div>
      )}

      {selectedTaskId && (
        <MakeOfferDialog taskId={selectedTaskId} onOfferCreated={handleOfferCreated} />
      )}
    </div>
  );
};

export default TasksList;

function TaskCard({ task, userRole, user, onAccept, onMakeOffer }: {
  task: Task;
  userRole: "client" | "tasker";
  user: any;
  onAccept: (taskId: string, offerId: string) => void;
  onMakeOffer: () => void;
}) {
  const myOffer = task.offers?.find((o) => o.tasker_id === user.id);

  return (
    <Card className="shadow-lg border-0 hover:shadow-xl transition-all duration-300">
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
          <div className="flex items-center space-x-2"><PoundSterling className="h-4 w-4" /><span>£{task.price_range_min} – £{task.price_range_max}</span></div>
          <div className="flex items-center space-x-2"><MapPin className="h-4 w-4" /><span>{task.location}</span></div>
          <div className="flex items-center space-x-2"><Clock className="h-4 w-4" /><span>{new Date(task.created_at).toLocaleString()}</span></div>
        </div>

        {userRole === "tasker" && !myOffer && (
          <Button onClick={onMakeOffer}>Make an Offer</Button>
        )}

        {userRole === "tasker" && myOffer && (
          <div className="text-sm text-gray-700 mt-2">
            Your Offer: <strong>£{myOffer.price}</strong> – Status: <strong>
              {myOffer.is_accepted ? "Accepted" : myOffer.is_accepted === false ? "Rejected" : "Pending"}
            </strong>
          </div>
        )}

        {userRole === "client" && task.offers && task.offers.length > 0 && (
          <div className="mt-4 space-y-2">
            <h4 className="font-semibold">Received Offers:</h4>
            {task.offers.map((offer) => (
              <div key={offer.id} className="border p-3 rounded shadow-sm">
                <p><strong>Tasker:</strong> {offer.tasker?.full_name ?? offer.tasker_id}</p>
                <p><strong>Price:</strong> £{offer.price}</p>
                {offer.message && <p><strong>Message:</strong> {offer.message}</p>}
                <p><strong>Date:</strong> {offer.proposed_date} at {offer.proposed_time}</p>
                <p><strong>Status:</strong> {offer.is_accepted ? "✅ Accepted" : "Pending"}</p>
                {!offer.is_accepted && (
                  <Button className="mt-2" onClick={() => onAccept(task.id, offer.id)}>
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
}

function getStatusBadge(status: string) {
  const map: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700",
    accepted: "bg-blue-100 text-blue-700",
    in_progress: "bg-purple-100 text-purple-700",
    completed: "bg-green-100 text-green-700",
    cancelled: "bg-gray-100 text-gray-700",
  };
  return <Badge className={map[status] || "bg-gray-100 text-gray-700"}>{status}</Badge>;
}
