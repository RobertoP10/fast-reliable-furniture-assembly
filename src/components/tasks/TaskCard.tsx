
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, PoundSterling, Calendar, X } from "lucide-react";
import { getStatusBadge } from "./getStatusBadge";
import { cancelTask, completeTask } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type Offer = Database["public"]["Tables"]["offers"]["Row"] & {
  tasker?: { full_name: string; approved?: boolean; created_at?: string; updated_at?: string };
};

type Task = Database["public"]["Tables"]["task_requests"]["Row"] & {
  offers?: Offer[] | null;
  client?: {
    full_name: string;
    location: string;
  };
};

interface TaskCardProps {
  task: Task;
  userRole: "client" | "tasker";
  user: any;
  onAccept: (taskId: string, offerId: string) => void;
  onMakeOffer: () => void;
  onTaskUpdate?: () => void;
}

export const TaskCard = ({ task, userRole, user, onAccept, onMakeOffer, onTaskUpdate }: TaskCardProps) => {
  const { toast } = useToast();
  const myOffer = task.offers?.find((offer) => offer.tasker_id === user.id);
  const hasOffered = !!myOffer;

  const handleCancelTask = async () => {
    if (!confirm("Are you sure you want to cancel this task?")) return;

    const result = await cancelTask(task.id, "Cancelled by client");
    if (result.success) {
      toast({ title: "✅ Task cancelled successfully" });
      onTaskUpdate?.();
    } else {
      toast({ 
        title: "❌ Failed to cancel task", 
        description: result.error,
        variant: "destructive" 
      });
    }
  };

  const handleCompleteTask = async () => {
    if (!confirm("Mark this task as completed?")) return;

    const result = await completeTask(task.id);
    if (result.success) {
      toast({ title: "✅ Task marked as completed" });
      onTaskUpdate?.();
    } else {
      toast({ 
        title: "❌ Failed to complete task", 
        description: result.error,
        variant: "destructive" 
      });
    }
  };

  return (
    <Card className="shadow-lg border-0 hover:shadow-xl transition-all duration-300">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-blue-900 mb-2">{task.title}</CardTitle>
            <CardDescription>{task.description}</CardDescription>
          </div>
          <div className="flex gap-2">
            {getStatusBadge(task.status)}
            {userRole === "client" && task.status === "pending" && !task.accepted_offer_id && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancelTask}
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
            )}
          </div>
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

        {task.required_date && task.required_time && (
          <div className="flex items-center space-x-2 mb-4 text-sm text-blue-700 bg-blue-50 p-2 rounded">
            <Calendar className="h-4 w-4" />
            <span>
              Required: {new Date(task.required_date).toLocaleDateString()} at {task.required_time}
            </span>
          </div>
        )}

        {userRole === "tasker" && task.status === "pending" && (
          hasOffered ? (
            <Badge>You already sent an offer</Badge>
          ) : (
            <Button onClick={onMakeOffer}>Make an Offer</Button>
          )
        )}

        {userRole === "tasker" && myOffer && (
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

        {userRole === "client" && task.offers && Array.isArray(task.offers) && task.offers.length > 0 && (
          <div className="mt-4 space-y-2">
            <h4 className="font-semibold">Received Offers:</h4>
            {task.offers.map((offer) => (
              <div key={offer.id} className="border p-3 rounded shadow-sm">
                <p><strong>Tasker:</strong> {offer.tasker?.full_name ?? offer.tasker_id}</p>
                <p><strong>Price:</strong> £{offer.price}</p>
                {offer.message && <p><strong>Message:</strong> {offer.message}</p>}
                <p><strong>Date:</strong> {offer.proposed_date} at {offer.proposed_time}</p>
                <p><strong>Status:</strong> {offer.is_accepted ? "✅ Accepted" : offer.is_accepted === false ? "❌ Rejected" : "Pending"}</p>
                {task.status === "pending" && !offer.is_accepted && offer.is_accepted !== false && (
                  <Button
                    className="mt-2"
                    onClick={() => onAccept(task.id, offer.id)}
                  >
                    Accept Offer
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}

        {userRole === "client" && task.status === "accepted" && (
          <div className="mt-4">
            <Button onClick={handleCompleteTask} className="bg-green-600 hover:bg-green-700">
              Mark as Completed
            </Button>
          </div>
        )}

        {task.completion_proof_urls && task.completion_proof_urls.length > 0 && (
          <div className="mt-4">
            <h4 className="font-semibold mb-2">Completion Photos:</h4>
            <div className="grid grid-cols-2 gap-2">
              {task.completion_proof_urls.map((url, index) => (
                <img key={index} src={url} alt={`Completion proof ${index + 1}`} className="rounded border" />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
