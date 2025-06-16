
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { TaskReviewModal } from "../TaskReviewModal";
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

interface TaskCompletedActionsProps {
  task: Task;
  myOffer: Offer | undefined;
  isMyOfferAccepted: boolean;
  user: any;
  onTaskUpdate?: () => void;
}

export const TaskCompletedActions = ({ 
  task, 
  myOffer, 
  isMyOfferAccepted, 
  user, 
  onTaskUpdate 
}: TaskCompletedActionsProps) => {
  const [showClientReviewModal, setShowClientReviewModal] = useState(false);
  const [hasReviewedClient, setHasReviewedClient] = useState(false);

  // Check if tasker has already reviewed the client for this task
  const checkClientReview = async () => {
    if (!user?.id || !task.client_id) return;

    try {
      const { data: existingReview, error } = await supabase
        .from('reviews')
        .select('id')
        .eq('task_id', task.id as any)
        .eq('reviewer_id', user.id as any)
        .eq('reviewee_id', task.client_id as any)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking client review:', error);
        return;
      }

      setHasReviewedClient(!!existingReview);
    } catch (error) {
      console.error('Error checking client review:', error);
    }
  };

  useEffect(() => {
    if (task.status === 'completed' && isMyOfferAccepted) {
      checkClientReview();
    }
  }, [task.status, isMyOfferAccepted, user?.id, task.client_id]);

  const handleClientReviewSubmitted = () => {
    setShowClientReviewModal(false);
    setHasReviewedClient(true);
    onTaskUpdate?.();
  };

  if (task.status !== "completed" || !isMyOfferAccepted) {
    return null;
  }

  return (
    <>
      <div className="bg-green-50 p-4 rounded-lg">
        <p className="text-sm text-green-700 font-medium">✅ Task Completed</p>
        <p className="text-sm text-gray-600">Completed at: {task.completed_at ? new Date(task.completed_at).toLocaleDateString() : 'N/A'}</p>
        {myOffer && (
          <p className="text-sm text-gray-600">Earned: £{myOffer.price}</p>
        )}
        
        {!hasReviewedClient && (
          <Button 
            onClick={() => setShowClientReviewModal(true)}
            variant="outline"
            className="mt-2 w-full"
          >
            Rate Client
          </Button>
        )}
        
        {hasReviewedClient && (
          <p className="text-sm text-green-600 mt-2">✅ Client reviewed</p>
        )}
      </div>
      
      {task.client_id && (
        <TaskReviewModal
          isOpen={showClientReviewModal}
          onClose={() => setShowClientReviewModal(false)}
          taskId={task.id}
          taskerId={task.client_id}
          taskerName={task.client?.full_name || "Client"}
          onReviewSubmitted={handleClientReviewSubmitted}
        />
      )}
    </>
  );
};
