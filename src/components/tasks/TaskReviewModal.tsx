
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ReviewForm } from "./review/ReviewForm";
import { useReviewSubmission } from "./review/ReviewSubmissionLogic";

interface TaskReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskId: string;
  taskerId: string;
  taskerName: string;
  onReviewSubmitted: () => void;
}

export const TaskReviewModal = ({
  isOpen,
  onClose,
  taskId,
  taskerId,
  taskerName,
  onReviewSubmitted
}: TaskReviewModalProps) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  const { submitReview, isSubmitting, hasSubmitted, resetSubmission } = useReviewSubmission(
    taskId,
    taskerId,
    onReviewSubmitted
  );

  const resetModal = () => {
    setRating(0);
    setComment("");
    resetSubmission();
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  const handleSubmit = async () => {
    const success = await submitReview(rating, comment);
    if (success) {
      // Close modal after successful submission
      setTimeout(() => {
        handleClose();
      }, 1000);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rate Your Experience</DialogTitle>
        </DialogHeader>
        
        <ReviewForm
          rating={rating}
          comment={comment}
          onRatingChange={setRating}
          onCommentChange={setComment}
          disabled={hasSubmitted}
          taskerName={taskerName}
        />

        <div className="flex gap-2">
          <Button variant="outline" onClick={handleClose} className="flex-1">
            {hasSubmitted ? "Close" : "Skip"}
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting || rating === 0 || hasSubmitted}
            className="flex-1"
          >
            {isSubmitting ? "Submitting..." : hasSubmitted ? "Submitted" : "Submit Review"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
