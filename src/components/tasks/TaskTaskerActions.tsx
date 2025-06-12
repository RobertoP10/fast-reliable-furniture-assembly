
import { Button } from "@/components/ui/button";
import { TaskOfferStatus } from "./actions/TaskOfferStatus";
import { TaskCancellationInfo } from "./actions/TaskCancellationInfo";
import { TaskAppointmentActions } from "./actions/TaskAppointmentActions";
import { TaskCompletedActions } from "./actions/TaskCompletedActions";
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

interface TaskTaskerActionsProps {
  task: Task;
  user: any;
  activeTab?: string;
  onMakeOffer: () => void;
  onTaskUpdate?: () => void;
  onChatWithClient?: (taskId: string, clientId: string) => void;
}

export const TaskTaskerActions = ({ 
  task, 
  user, 
  activeTab, 
  onMakeOffer, 
  onTaskUpdate, 
  onChatWithClient 
}: TaskTaskerActionsProps) => {
  const myOffer = task.offers?.find((offer) => offer.tasker_id === user.id);
  const hasOffered = !!myOffer;
  const isMyOfferAccepted = myOffer && task.accepted_offer_id === myOffer.id && myOffer.status === 'accepted';

  const handleChatWithClient = () => {
    if (onChatWithClient && task.client_id) {
      onChatWithClient(task.id, task.client_id);
    }
  };

  const handleTaskCompleted = () => {
    // Show client review modal after task completion if not already reviewed
    onTaskUpdate?.();
  };

  // Available Tasks tab - show Make Offer button only if no offer submitted yet and task is not cancelled
  if (activeTab === "available" && !hasOffered && task.status !== 'cancelled') {
    return (
      <Button onClick={onMakeOffer} className="bg-blue-600 hover:bg-blue-700">
        Make an Offer
      </Button>
    );
  }

  // Show cancelled message for available tasks that are cancelled
  if (activeTab === "available" && task.status === 'cancelled') {
    return <TaskCancellationInfo task={task} />;
  }

  // My Offers tab - show offer status and details (including cancelled offers)
  if (activeTab === "my-tasks" && myOffer) {
    return (
      <div className="space-y-3">
        <TaskOfferStatus offer={myOffer} task={task} />
      </div>
    );
  }

  // Appointments tab - show appointment details and actions (only for accepted offers)
  if (activeTab === "appointments") {
    return (
      <TaskAppointmentActions
        task={task}
        myOffer={myOffer}
        isMyOfferAccepted={isMyOfferAccepted}
        onChatWithClient={handleChatWithClient}
        onTaskUpdate={onTaskUpdate}
        onTaskCompleted={handleTaskCompleted}
      />
    );
  }

  // Completed tab - show completion details and client review option
  if (activeTab === "completed") {
    return (
      <TaskCompletedActions
        task={task}
        myOffer={myOffer}
        isMyOfferAccepted={isMyOfferAccepted}
        user={user}
        onTaskUpdate={onTaskUpdate}
      />
    );
  }

  return null;
};
