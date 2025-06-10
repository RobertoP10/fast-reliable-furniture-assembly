
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { cancelTask } from "@/lib/tasks";
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

interface TaskClientActionsProps {
  task: Task;
  user: any;
  activeTab?: string;
  onAccept: (taskId: string, offerId: string) => void;
  onTaskUpdate?: () => void;
}

export const TaskClientActions = ({ task, user, activeTab, onAccept, onTaskUpdate }: TaskClientActionsProps) => {
  const { toast } = useToast();
  const [cancelReason, setCancelReason] = useState("");
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const acceptedOffer = task.offers?.find((offer) => offer.id === task.accepted_offer_id);

  const handleCancelTask = async () => {
    if (!cancelReason.trim()) {
      toast({ title: "Please provide a reason for cancellation", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    const result = await cancelTask(task.id, cancelReason);
    if (result.success) {
      toast({ title: "✅ Task cancelled successfully" });
      setShowCancelDialog(false);
      setCancelReason("");
      onTaskUpdate?.();
    } else {
      toast({ 
        title: "❌ Failed to cancel task", 
        description: result.error,
        variant: "destructive" 
      });
    }
    setIsSubmitting(false);
  };

  // Only render if this is the client's task
  if (task.client_id !== user.id) return null;

  // Pending Requests tab - show cancel button for pending tasks
  if (activeTab === "available" && task.status === "pending") {
    return (
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="text-red-600 border-red-200 hover:bg-red-50"
          >
            <X className="h-4 w-4 mr-1" />
            Cancel Task
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="cancel-reason">Reason for Cancellation</Label>
              <Input
                id="cancel-reason"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Please provide a reason..."
                className="mt-1"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowCancelDialog(false)}
                className="flex-1"
              >
                Keep Task
              </Button>
              <Button
                onClick={handleCancelTask}
                disabled={isSubmitting || !cancelReason.trim()}
                variant="destructive"
                className="flex-1"
              >
                {isSubmitting ? "Cancelling..." : "Cancel Task"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Received Offers tab - show all offers with accept buttons (only if no offer accepted yet)
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
                {task.status === "pending" && !task.accepted_offer_id && (
                  <Button
                    onClick={() => onAccept(task.id, offer.id)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Accept Offer
                  </Button>
                )}
                {task.accepted_offer_id === offer.id && (
                  <Badge className="bg-green-100 text-green-700">Accepted</Badge>
                )}
                {task.accepted_offer_id && task.accepted_offer_id !== offer.id && (
                  <Badge className="bg-red-100 text-red-700">Not Selected</Badge>
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
