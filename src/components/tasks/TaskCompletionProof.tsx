
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

interface TaskCompletionProofProps {
  proofUrls?: string[] | null;
  task: Task;
  user: any;
  userRole: "client" | "tasker";
}

export const TaskCompletionProof = ({ proofUrls, task, user, userRole }: TaskCompletionProofProps) => {
  if (!proofUrls || proofUrls.length === 0) return null;

  // Check if user is authorized to view completion photos
  const isAuthorized = () => {
    // Client can always see their own task's completion photos
    if (userRole === "client" && task.client_id === user?.id) {
      return true;
    }

    // Tasker can only see photos if they were the accepted tasker
    if (userRole === "tasker" && task.offers) {
      const acceptedOffer = task.offers.find(offer => offer.status === "accepted");
      return acceptedOffer?.tasker_id === user?.id;
    }

    return false;
  };

  if (!isAuthorized()) {
    return (
      <div className="mt-4">
        <h4 className="font-semibold mb-2">Completion Photos:</h4>
        <div className="bg-muted p-4 rounded-lg text-center">
          <p className="text-sm text-muted-foreground">
            Accesul la pozele de finalizare este restricționat
          </p>
        </div>
      </div>
    );
  }

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
