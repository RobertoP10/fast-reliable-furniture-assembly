
interface RatingDescriptionProps {
  rating: number;
}

export const RatingDescription = ({ rating }: RatingDescriptionProps) => {
  if (rating === 0) return null;

  const descriptions = {
    1: "Poor",
    2: "Fair", 
    3: "Good",
    4: "Very Good",
    5: "Excellent"
  };

  return (
    <p className="text-sm text-gray-600">
      {descriptions[rating as keyof typeof descriptions]}
    </p>
  );
};
