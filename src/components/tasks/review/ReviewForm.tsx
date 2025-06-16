
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { StarRating } from "./StarRating";
import { RatingDescription } from "./RatingDescription";

interface ReviewFormProps {
  onRatingChange: (rating: number) => void;
  onCommentChange: (comment: string) => void;
  rating: number;
  comment: string;
  disabled?: boolean;
  taskerName: string;
}

export const ReviewForm = ({
  onRatingChange,
  onCommentChange,
  rating,
  comment,
  disabled = false,
  taskerName
}: ReviewFormProps) => {
  const [hoveredRating, setHoveredRating] = useState(0);

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-gray-600 mb-3">
          How was your experience with {taskerName}?
        </p>
        
        <StarRating
          rating={rating}
          hoveredRating={hoveredRating}
          onRatingChange={onRatingChange}
          onHover={setHoveredRating}
          onHoverLeave={() => setHoveredRating(0)}
          disabled={disabled}
        />
        
        <RatingDescription rating={rating} />
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700 block mb-2">
          Additional Comments (Optional)
        </label>
        <Textarea
          value={comment}
          onChange={(e) => onCommentChange(e.target.value)}
          placeholder="Share details about your experience..."
          rows={3}
          disabled={disabled}
        />
      </div>
    </div>
  );
};
