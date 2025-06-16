
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

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
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const { toast } = useToast();

  const resetModal = () => {
    setRating(0);
    setHoveredRating(0);
    setComment("");
    setIsSubmitting(false);
    setHasSubmitted(false);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      toast({
        title: "Rating required",
        description: "Please select a rating before submitting",
        variant: "destructive"
      });
      return;
    }

    if (hasSubmitted) {
      toast({
        title: "Review already submitted",
        description: "You have already submitted a review for this task",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Check if review already exists
      const { data: existingReview, error: checkError } = await supabase
        .from('reviews')
        .select('id')
        .eq('task_id', taskId)
        .eq('reviewer_id', user.id)
        .eq('reviewee_id', taskerId)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Error checking existing review:', checkError);
        throw checkError;
      }

      if (existingReview) {
        toast({
          title: "Review already exists",
          description: "You have already submitted a review for this task",
          variant: "destructive"
        });
        setHasSubmitted(true);
        return;
      }

      const { error } = await supabase
        .from('reviews')
        .insert({
          task_id: taskId,
          reviewer_id: user.id,
          reviewee_id: taskerId,
          rating,
          comment: comment.trim() || null
        });

      if (error) throw error;

      toast({
        title: "✅ Review submitted",
        description: "Thank you for your feedback!"
      });

      setHasSubmitted(true);
      onReviewSubmitted();
      
      // Close modal after successful submission
      setTimeout(() => {
        handleClose();
      }, 1000);
      
    } catch (error) {
      console.error('Error submitting review:', error);
      toast({
        title: "❌ Failed to submit review",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rate Your Experience</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-3">
              How was your experience with {taskerName}?
            </p>
            
            <div className="flex space-x-1 mb-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className="p-1"
                  disabled={hasSubmitted}
                  onMouseEnter={() => !hasSubmitted && setHoveredRating(star)}
                  onMouseLeave={() => !hasSubmitted && setHoveredRating(0)}
                  onClick={() => !hasSubmitted && setRating(star)}
                >
                  <Star
                    className={`h-6 w-6 ${
                      star <= (hoveredRating || rating)
                        ? 'text-yellow-400 fill-current'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
            
            {rating > 0 && (
              <p className="text-sm text-gray-600">
                {rating === 1 && "Poor"}
                {rating === 2 && "Fair"}
                {rating === 3 && "Good"}
                {rating === 4 && "Very Good"}
                {rating === 5 && "Excellent"}
              </p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">
              Additional Comments (Optional)
            </label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share details about your experience..."
              rows={3}
              disabled={hasSubmitted}
            />
          </div>

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
        </div>
      </DialogContent>
    </Dialog>
  );
};
