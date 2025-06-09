
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, PoundSterling, Calendar, X, CheckCircle } from "lucide-react";
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
  activeTab?: string;
}

export const TaskCard = ({ task, userRole, user, onAccept, onMakeOffer, onTaskUpdate, activeTab }: TaskCardProps) => {
  const { toast } = useToast();
  const myOffer = task.offers?.find((offer) => offer.tasker_id === user.id);
  const hasOffered = !!myOffer;
  const acceptedOffer = task.offers?.find((offer) => offer.id === task.accepted_offer_id);

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
    if (!confirm("Mark this task as completed? This will notify the client.")) return;

    const result = await completeTask(task.id);
    if (result.success) {
      toast({ title: "✅ Task marked as completed and client notified" });
      onTaskUpdate?.();
    } else {
      toast({ 
        title: "❌ Failed to complete task", 
        description: result.error,
        variant: "destructive" 
      });
    }
  };

  const renderTaskerView = () => {
    // Available Tasks tab
    if (activeTab === "available" && !hasOffered) {
      return (
        <Button onClick={onMakeOffer} className="bg-blue-600 hover:bg-blue-700">
          Make an Offer
        </Button>
      );
    }

    // My Offers tab
    if (activeTab === "my-tasks" && myOffer) {
      const offerStatus = myOffer.is_accepted === true ? "Accepted" : 
                         myOffer.is_accepted === false ? "Rejected" : "Pending";
      
      return (
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-gray-700">
              <strong>Your Offer:</strong> £{myOffer.price} on {myOffer.proposed_date} at {myOffer.proposed_time}
            </p>
            <p className="text-sm mt-1">
              <strong>Status:</strong> <span className={`font-medium ${
                offerStatus === "Accepted" ? "text-green-600" : 
                offerStatus === "Rejected" ? "text-red-600" : "text-yellow-600"
              }`}>{offerStatus}</span>
            </p>
            {myOffer.message && (
              <p className="text-sm mt-1"><strong>Message:</strong> {myOffer.message}</p>
            )}
          </div>
          
          {task.status === "accepted" && myOffer.is_accepted && (
            <Button onClick={handleCompleteTask} className="bg-green-600 hover:bg-green-700">
              <CheckCircle className="h-4 w-4 mr-2" />
              Mark as Completed
            </Button>
          )}
        </div>
      );
    }

    return null;
  };

  const renderClientView = () => {
    // Pending Requests tab - show cancel button
    if (activeTab === "available" && task.status === "pending") {
      return (
        <Button
          variant="outline"
          size="sm"
          onClick={handleCancelTask}
          className="text-red-600 border-red-200 hover:bg-red-50"
        >
          <X className="h-4 w-4 mr-1" />
          Cancel Task
        </Button>
      );
    }

    // Received Offers tab - show all offers with accept buttons
    if (activeTab === "received-offers" && task.offers && Array.isArray(task.offers) && task.offers.length > 0) {
      return (
        <div className="mt-4 space-y-3">
          <h4 className="font-semibold text-gray-800">Received Offers ({task.offers.length})</h4>
          {task.offers.map((offer) => (
            <div key={offer.id} className="border border-gray-200 p-4 rounded-lg bg-gray-50">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <p className="font-medium text-gray-800">{offer.tasker?.full_name || 'Unknown Tasker'}</p>
                  <p className="text-lg font-bold text-green-600">£{offer.price}</p>
                  <p className="text-sm text-gray-600">
                    Proposed: {offer.proposed_date} at {offer.proposed_time}
                  </p>
                  {offer.message && (
                    <p className="text-sm text-gray-700 mt-2 italic">"{offer.message}"</p>
                  )}
                </div>
                <div className="ml-4">
                  {task.status === "pending" && !offer.is_accepted && offer.is_accepted !== false && (
                    <Button
                      onClick={() => onAccept(task.id, offer.id)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Accept Offer
                    </Button>
                  )}
                  {offer.is_accepted === true && (
                    <Badge className="bg-green-100 text-green-700">Accepted</Badge>
                  )}
                  {offer.is_accepted === false && (
                    <Badge className="bg-red-100 text-red-700">Rejected</Badge>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    // Accepted Tasks tab - show accepted offer details
    if (activeTab === "my-tasks" && task.status === "accepted" && acceptedOffer) {
      return (
        <div className="mt-4 bg-green-50 p-4 rounded-lg">
          <h4 className="font-semibold text-green-800 mb-2">Accepted Offer</h4>
          <p><strong>Tasker:</strong> {acceptedOffer.tasker?.full_name || 'Unknown'}</p>
          <p><strong>Price:</strong> £{acceptedOffer.price}</p>
          <p><strong>Scheduled:</strong> {acceptedOffer.proposed_date} at {acceptedOffer.proposed_time}</p>
          {acceptedOffer.message && (
            <p className="mt-2 italic">"{acceptedOffer.message}"</p>
          )}
        </div>
      );
    }

    return null;
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
            <span>{new Date(task.created_at).toLocaleDateString()}</span>
          </div>
        </div>

        {task.required_date && task.required_time && (
          <div className="flex items-center space-x-2 mb-4 text-sm text-blue-700 bg-blue-50 p-3 rounded-lg">
            <Calendar className="h-4 w-4" />
            <span>
              <strong>Required:</strong> {new Date(task.required_date).toLocaleDateString()} at {task.required_time}
            </span>
          </div>
        )}

        {userRole === "client" && task.client_id === user.id && renderClientView()}
        {userRole === "tasker" && renderTaskerView()}

        {task.completion_proof_urls && task.completion_proof_urls.length > 0 && (
          <div className="mt-4">
            <h4 className="font-semibold mb-2">Completion Photos:</h4>
            <div className="grid grid-cols-2 gap-2">
              {task.completion_proof_urls.map((url, index) => (
                <img key={index} src={url} alt={`Completion proof ${index + 1}`} className="rounded border w-full h-32 object-cover" />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
