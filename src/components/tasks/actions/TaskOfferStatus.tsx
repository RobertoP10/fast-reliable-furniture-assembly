
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

interface TaskOfferStatusProps {
  offer: Offer;
  task: Task;
}

export const TaskOfferStatus = ({ offer, task }: TaskOfferStatusProps) => {
  const getOfferStatusDisplay = (offer: Offer) => {
    switch (offer.status) {
      case 'accepted':
        return { text: "Accepted", color: "bg-green-50 text-green-700" };
      case 'rejected':
        return { text: "Not Selected", color: "bg-red-50 text-red-700" };
      case 'cancelled':
        return { text: "Task Cancelled", color: "bg-gray-50 text-gray-700" };
      case 'pending':
      default:
        return { text: "Pending", color: "bg-yellow-50 text-yellow-700" };
    }
  };

  const statusDisplay = getOfferStatusDisplay(offer);

  return (
    <div className={`p-4 rounded-lg border ${statusDisplay.color} ${
      offer.status === 'cancelled' ? 'border-red-200' : ''
    }`}>
      <p className="font-medium">Your Offer: {statusDisplay.text}</p>
      <p className="text-sm">Price: £{offer.price}</p>
      {offer.proposed_date && (
        <p className="text-sm">Date: {offer.proposed_date} at {offer.proposed_time}</p>
      )}
      {offer.message && (
        <p className="text-sm italic mt-1">"{offer.message}"</p>
      )}
      {offer.status === 'cancelled' && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded">
          <p className="text-sm text-red-700 font-medium">Task Cancelled by Client</p>
          <p className="text-xs text-red-600 mt-1">
            The client cancelled this task. Your offer is no longer valid and you will not be able to proceed with this work.
          </p>
          {task.cancellation_reason && (
            <p className="text-xs text-red-600 mt-2">
              <strong>Reason:</strong> {task.cancellation_reason}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
