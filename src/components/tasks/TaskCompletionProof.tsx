
interface TaskCompletionProofProps {
  proofUrls?: string[] | null;
}

export const TaskCompletionProof = ({ proofUrls }: TaskCompletionProofProps) => {
  if (!proofUrls || proofUrls.length === 0) return null;

  return (
    <div className="mt-4">
      <h4 className="font-semibold mb-2">Completion Photos:</h4>
      <div className="grid grid-cols-2 gap-2">
        {proofUrls.map((url, index) => (
          <img 
            key={index} 
            src={url} 
            alt={`Completion proof ${index + 1}`} 
            className="rounded border w-full h-32 object-cover" 
          />
        ))}
      </div>
    </div>
  );
};
