import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, X, MessageCircle } from "lucide-react";
import { cancelTask } from "@/lib/tasks";
import { useToast } from "@/hooks/use-toast";
import { TaskReviewModal } from "./TaskReviewModal";
import { supabase } from "@/integrations/supabase/client";
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

export const TaskClientActions = ({ 
  task, 
  user, 
  activeTab, 
  onAccept, 
  onTaskUpdate 
}: TaskClientActionsProps) => {
  const { toast } = useToast();
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewTaskerId, setReviewTaskerId] = useState<string | null>(null);
  const [reviewTaskerName, setReviewTaskerName] = useState<string>("");
  const [hasExistingReview, setHasExistingReview] = useState(false);

  const isMyTask = task.client_id === user?.id;
  const acceptedOffer = task.offers?.find(offer => offer.id === task.accepted_offer_id);

  // Check if review already exists for this task
  const checkExistingReview = async () => {
    if (!acceptedOffer || !user?.id) return;

    try {
      const { data: existingReview } = await supabase
        .from('reviews')
        .select('id')
        .eq('task_id', task.id)
        .eq('reviewer_id', user.id)
        .eq('reviewee_id', acceptedOffer.tasker_id)
        .maybeSingle();

      setHasExistingReview(!!existingReview);
    } catch (error) {
      console.error('Error checking existing review:', error);
    }
  };

  useEffect(() => {
    if (task.status === 'completed' && acceptedOffer) {
      checkExistingReview();
    }
  }, [task.status, acceptedOffer, user?.id]);

  const handleCancelTask = async () => {
    if (!confirm("Are you sure you want to cancel this task? This action cannot be undone.")) {
      return;
    }

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

  const handleReviewSubmitted = () => {
    setShowReviewModal(false);
    setReviewTaskerId(null);
    setReviewTaskerName("");
    setHasExistingReview(true);
    onTaskUpdate?.();
  };

  if (!isMyTask) return null;

  if ((activeTab === "available" || activeTab === "my-tasks") && task.status === "pending") {
    return (
      <div className="flex gap-2">
        <Button 
          onClick={handleCancelTask}
          variant="outline"
          className="text-red-600 hover:text-red-700"
        >
          <X className="h-4 w-4 mr-2" />
          Cancel Task
        </Button>
      </div>
    );
  }

  if (activeTab === "received-offers" && task.status === "pending" && task.offers && task.offers.length > 0) {
    return (
      <div className="space-y-3">
        <h4 className="font-semibold">Offers Received:</h4>
        {task.offers.map((offer) => (
          <div key={offer.id} className="border rounded-lg p-3 bg-blue-50">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="font-medium">{offer.tasker?.full_name || "Tasker"}</p>
                <p className="text-sm text-gray-600">Price: £{offer.price}</p>
                {offer.proposed_date && (
                  <p className="text-sm text-gray-600">
                    Date: {offer.proposed_date} at {offer.proposed_time}
                  </p>
                )}
              </div>
              <Badge className="bg-yellow-100 text-yellow-700">
                {offer.tasker?.approved ? "Verified" : "Unverified"}
              </Badge>
            </div>
            {offer.message && (
              <p className="text-sm text-gray-700 mb-3 italic">"{offer.message}"</p>
            )}
            <Button 
              onClick={() => onAccept(task.id, offer.id)}
              className="bg-green-600 hover:bg-green-700 w-full"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Accept Offer
            </Button>
          </div>
        ))}
      </div>
    );
  }

  if (activeTab === "appointments" && task.status === "accepted" && acceptedOffer) {
    return (
      <div className="bg-green-50 p-4 rounded-lg">
        <p className="text-sm text-green-700 font-medium">✅ Offer Accepted</p>
        <p className="text-sm text-gray-600">Tasker: {acceptedOffer.tasker?.full_name}</p>
        <p className="text-sm text-gray-600">Price: £{acceptedOffer.price}</p>
        {acceptedOffer.proposed_date && (
          <p className="text-sm text-gray-600">
            Scheduled: {acceptedOffer.proposed_date} at {acceptedOffer.proposed_time}
          </p>
        )}
      </div>
    );
  }

  // Completed Tasks tab - only show review button if no review exists
  if (activeTab === "completed" && task.status === "completed" && acceptedOffer) {
    return (
      <>
        <div className="bg-green-50 p-4 rounded-lg">
          <p className="text-sm text-green-700 font-medium">✅ Task Completed</p>
          <p className="text-sm text-gray-600">Completed at: {task.completed_at ? new Date(task.completed_at).toLocaleDateString() : 'N/A'}</p>
          <p className="text-sm text-gray-600">Tasker: {acceptedOffer.tasker?.full_name}</p>
          <p className="text-sm text-gray-600">Total Paid: £{acceptedOffer.price}</p>
          
          {!hasExistingReview ? (
            <Button 
              onClick={() => {
                setReviewTaskerId(acceptedOffer.tasker_id);
                setReviewTaskerName(acceptedOffer.tasker?.full_name || "Tasker");
                setShowReviewModal(true);
              }}
              variant="outline"
              className="mt-2 w-full"
            >
              Leave a Review
            </Button>
          ) : (
            <p className="text-sm text-green-600 mt-2">✅ Review submitted</p>
          )}
        </div>
        
        {reviewTaskerId && (
          <TaskReviewModal
            isOpen={showReviewModal}
            onClose={() => setShowReviewModal(false)}
            taskId={task.id}
            taskerId={reviewTaskerId}
            taskerName={reviewTaskerName}
            onReviewSubmitted={handleReviewSubmitted}
          />
        )}
      </>
    );
  }

  return null;
};
