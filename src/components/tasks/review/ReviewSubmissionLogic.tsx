
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const useReviewSubmission = (
  taskId: string,
  taskerId: string,
  onReviewSubmitted: () => void
) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const { toast } = useToast();

  const submitReview = async (rating: number, comment: string) => {
    if (rating === 0) {
      toast({
        title: "Rating required",
        description: "Please select a rating before submitting",
        variant: "destructive"
      });
      return false;
    }

    if (hasSubmitted) {
      toast({
        title: "Review already submitted",
        description: "You have already submitted a review for this task",
        variant: "destructive"
      });
      return false;
    }

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Check if review already exists
      const { data: existingReview, error: checkError } = await supabase
        .from('reviews')
        .select('id')
        .eq('task_id', taskId as any)
        .eq('reviewer_id', user.id as any)
        .eq('reviewee_id', taskerId as any)
        .maybeSingle();

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
        return false;
      }

      const { error } = await supabase
        .from('reviews')
        .insert({
          task_id: taskId as any,
          reviewer_id: user.id as any,
          reviewee_id: taskerId as any,
          rating,
          comment: comment.trim() || null
        } as any);

      if (error) throw error;

      toast({
        title: "✅ Review submitted",
        description: "Thank you for your feedback!"
      });

      setHasSubmitted(true);
      onReviewSubmitted();
      return true;
      
    } catch (error) {
      console.error('Error submitting review:', error);
      toast({
        title: "❌ Failed to submit review",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetSubmission = () => {
    setIsSubmitting(false);
    setHasSubmitted(false);
  };

  return {
    submitReview,
    isSubmitting,
    hasSubmitted,
    resetSubmission
  };
};
