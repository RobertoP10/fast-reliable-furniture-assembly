import { useEffect, useState } from "react";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, PoundSterling } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { fetchTasks } from "@/lib/tasks";
import { acceptOffer } from "@/lib/offers";
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
}

const TasksList = ({ userRole }: TasksListProps) => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"available" | "my-tasks" | "completed" | "received-offers">("available");
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    const fetchedTasks = await fetchTasks(user.id, userRole);
    setTasks(fetchedTasks);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [user, userRole, activeTab]);

  const filteredTasks = tasks.filter(task => {
    if (userRole === "tasker") {
      if (activeTab === "available")
        return task.status === "pending" && !(task.offers?.some(offer => offer.tasker_id === user.id));
      if (activeTab === "my-tasks")
        return task.status === "in_progress" && task.accepted_offer_id && task.offers?.some(o => o.id === task.accepted_offer_id && o.tasker_id === user.id);
    } else if (userRole === "client") {
      if (activeTab === "received-offers") return task.offers && task.offers.length > 0;
      if (activeTab === "completed") return task.status === "completed";
    }
    return true;
  });

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <div className="flex gap-4 mb-4">
        {["available", "my-tasks", "completed", "received-offers"].map(tab => (
          <Button key={tab} variant={activeTab === tab ? "default" : "outline"} onClick={() => setActiveTab(tab as any)}>
            {tab.replace("-", " ")}
          </Button>
        ))}
      </div>

      {filteredTasks.map((task) => (
        <Card key={task.id} className="mb-4">
          <CardHeader>
            <CardTitle>{task.category}</CardTitle>
            <CardDescription>{task.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Badge><MapPin className="h-4 w-4 mr-1" /> {task.location}</Badge>
              <Badge><Clock className="h-4 w-4 mr-1" /> {task.proposed_date}</Badge>
              <Badge><PoundSterling className="h-4 w-4 mr-1" /> £{task.budget ?? "N/A"}</Badge>
            </div>

            {userRole === "tasker" && activeTab === "available" && (
              <Button className="mt-2" onClick={() => setSelectedTaskId(task.id)}>Make Offer</Button>
            )}

            {userRole === "client" && activeTab === "received-offers" && task.offers?.map((offer) => (
              <div key={offer.id} className="border rounded p-2 my-2">
                <p><strong>From:</strong> {offer.tasker?.full_name}</p>
                <p><strong>Price:</strong> £{offer.price}</p>
                <p><strong>Message:</strong> {offer.message}</p>
                <Button onClick={() => acceptOffer(task.id, offer.id)}>Accept Offer</Button>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}

      <MakeOfferDialog
        taskId={selectedTaskId || ""}
        onOpenChange={() => setSelectedTaskId(null)}
        onOfferCreated={loadData}
      />
    </div>
  );
};

export default TasksList;
