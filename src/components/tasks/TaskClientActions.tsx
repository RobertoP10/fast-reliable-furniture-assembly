
import { TaskCancelButton } from "./client/TaskCancelButton";
import { OffersList } from "./client/OffersList";
import { AcceptedOfferInfo } from "./client/AcceptedOfferInfo";
import { CompletedTaskReview } from "./client/CompletedTaskReview";
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

interface TaskClientActionsProps {
  task: Task;
  user: any;
  activeTab?: string;
  onAccept: (taskId: string, offerId: string) => void;
  onTaskUpdate?: () => void;
}

export const TaskClientActions = ({ 
  task, 
  user, 
  activeTab, 
  onAccept, 
  onTaskUpdate 
}: TaskClientActionsProps) => {
  const isMyTask = task.client_id === user?.id;
  const acceptedOffer = task.offers?.find(offer => offer.id === task.accepted_offer_id);

  if (!isMyTask) return null;

  // Pending tasks - show cancel button
  if ((activeTab === "available" || activeTab === "my-tasks") && task.status === "pending") {
    return (
      <div className="flex gap-2">
        <TaskCancelButton taskId={task.id} onTaskUpdate={onTaskUpdate} />
      </div>
    );
  }

  // Received offers - show offers list
  if (activeTab === "received-offers" && task.status === "pending" && task.offers && task.offers.length > 0) {
    return <OffersList offers={task.offers} onAccept={onAccept} taskId={task.id} />;
  }

  // Accepted appointments - show accepted offer info
  if (activeTab === "appointments" && task.status === "accepted" && acceptedOffer) {
    return <AcceptedOfferInfo acceptedOffer={acceptedOffer} />;
  }

  // Completed tasks - show completion info and review option
  if (activeTab === "completed" && task.status === "completed" && acceptedOffer) {
    return <CompletedTaskReview task={task} acceptedOffer={acceptedOffer} user={user} onTaskUpdate={onTaskUpdate} />;
  }

  return null;
};
