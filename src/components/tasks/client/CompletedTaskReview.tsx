
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { TaskReviewModal } from "../TaskReviewModal";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Offer = Database["public"]["Tables"]["offers"]["Row"] & {
  tasker?: { full_name: string; approved?: boolean; created_at?: string; updated_at?: string };
};

type Task = Database["public"]["Tables"]["task_requests"]["Row"];

interface CompletedTaskReviewProps {
  task: Task;
  acceptedOffer: Offer;
  user: any;
  onTaskUpdate?: () => void;
}

export const CompletedTaskReview = ({ task, acceptedOffer, user, onTaskUpdate }: CompletedTaskReviewProps) => {
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [hasExistingReview, setHasExistingReview] = useState(false);

  // Check if review already exists for this task
  const checkExistingReview = async () => {
    if (!acceptedOffer || !user?.id) return;

    try {
      const { data: existingReview, error } = await supabase
        .from('reviews')
        .select('id')
        .eq('task_id', task.id as any)
        .eq('reviewer_id', user.id as any)
        .eq('reviewee_id', acceptedOffer.tasker_id as any)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking existing review:', error);
        return;
      }

      setHasExistingReview(!!existingReview);
    } catch (error) {
      console.error('Error checking existing review:', error);
    }
  };

  useEffect(() => {
    checkExistingReview();
  }, [acceptedOffer, user?.id]);

  const handleReviewSubmitted = () => {
    setShowReviewModal(false);
    setHasExistingReview(true);
    onTaskUpdate?.();
  };

  return (
    <>
      <div className="bg-green-50 p-4 rounded-lg">
        <p className="text-sm text-green-700 font-medium">✅ Task Completed</p>
        <p className="text-sm text-gray-600">Completed at: {task.completed_at ? new Date(task.completed_at).toLocaleDateString() : 'N/A'}</p>
        <p className="text-sm text-gray-600">Tasker: {acceptedOffer.tasker?.full_name}</p>
        <p className="text-sm text-gray-600">Total Paid: £{acceptedOffer.price}</p>
        
        {!hasExistingReview ? (
          <Button 
            onClick={() => setShowReviewModal(true)}
            variant="outline"
            className="mt-2 w-full"
          >
            Leave a Review
          </Button>
        ) : (
          <p className="text-sm text-green-600 mt-2">✅ Review submitted</p>
        )}
      </div>
      
      <TaskReviewModal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        taskId={task.id}
        taskerId={acceptedOffer.tasker_id}
        taskerName={acceptedOffer.tasker?.full_name || "Tasker"}
        onReviewSubmitted={handleReviewSubmitted}
      />
    </>
  );
};
