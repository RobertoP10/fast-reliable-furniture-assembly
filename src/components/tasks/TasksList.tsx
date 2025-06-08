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
import { MapPin, Clock, PoundSterling } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { fetchTasks } from "@/lib/tasks";
import MakeOfferDialog from "@/components/tasks/MakeOfferDialog";
import type { Database } from "@/integrations/supabase/types";

type Offer = Database["public"]["Tables"]["offers"]["Row"] & {
  tasker?: {
    full_name: string;
    approved: boolean;
  };
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
  showTab?: "all" | "received-offers";
}

export default function TasksList({ userRole, showTab = "all" }: TasksListProps) {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const loadData = async () => {
    if (!user?.id || !user.role) return;
    const allTasks = await fetchTasks(user.id, user.role);
    console.log("🔍 [TASKS] All fetched tasks:", allTasks);

    if (showTab === "received-offers" && user.role === "client") {
      const filtered = allTasks.filter((task) => Array.isArray(task.offers) && task.offers.length > 0);
      console.log("📦 [TASKS] Filtered tasks for received-offers:", filtered);
      setTasks(filtered);
    } else {
      setTasks(allTasks);
    }
  };

  useEffect(() => {
    loadData();
  }, [user?.id, user?.role, showTab]);

  const handleOpenOfferDialog = (taskId: string) => {
    setSelectedTaskId(taskId);
  };

  return (
    <div className="space-y-4">
      {tasks.map((task) => (
        <Card key={task.id}>
          <CardHeader>
            <CardTitle>{task.category}</CardTitle>
            <CardDescription>{task.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2">
              <MapPin size={16} />
              <span>{task.location}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock size={16} />
              <span>{new Date(task.created_at).toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-2">
              <PoundSterling size={16} />
              <span>{task.budget ? `£${task.budget}` : "No budget specified"}</span>
            </div>

            {userRole === "tasker" && (
              <Button onClick={() => handleOpenOfferDialog(task.id)}>
                Make an Offer
              </Button>
            )}

            {userRole === "client" && showTab === "received-offers" && task.offers && (
              <div className="space-y-2">
                <h4 className="font-semibold">Received Offers</h4>
                {task.offers.map((offer) => (
                  <Card key={offer.id} className="p-2">
                    <p><strong>Tasker:</strong> {offer.tasker?.full_name}</p>
                    <p><strong>Price:</strong> £{offer.price}</p>
                    <p><strong>Message:</strong> {offer.message}</p>
                    <p><strong>Date:</strong> {offer.proposed_date} at {offer.proposed_time}</p>
                    <p>
                      <strong>Status:</strong>{" "}
                      {offer.is_accepted ? (
                        <Badge variant="success">Accepted</Badge>
                      ) : (
                        <Badge variant="secondary">Pending</Badge>
                      )}
                    </p>
                    {!offer.is_accepted && (
                      <Button variant="outline">
                        Accept Offer {/* TODO: Hook this up */}
                      </Button>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      {selectedTaskId && (
        <MakeOfferDialog
          taskId={selectedTaskId}
          open={!!selectedTaskId}
          onOpenChange={() => setSelectedTaskId(null)}
          onOfferCreated={loadData}
        />
      )}
    </div>
  );
}
