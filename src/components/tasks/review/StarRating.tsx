
import { Star } from "lucide-react";

interface StarRatingProps {
  rating: number;
  hoveredRating: number;
  onRatingChange: (rating: number) => void;
  onHover: (rating: number) => void;
  onHoverLeave: () => void;
  disabled?: boolean;
}

export const StarRating = ({
  rating,
  hoveredRating,
  onRatingChange,
  onHover,
  onHoverLeave,
  disabled = false
}: StarRatingProps) => {
  return (
    <div className="flex space-x-1 mb-4">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className="p-1"
          disabled={disabled}
          onMouseEnter={() => !disabled && onHover(star)}
          onMouseLeave={() => !disabled && onHoverLeave()}
          onClick={() => !disabled && onRatingChange(star)}
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
  );
};
