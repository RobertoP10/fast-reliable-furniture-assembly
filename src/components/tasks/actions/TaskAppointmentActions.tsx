
import { Button } from "@/components/ui/button";
import { MessageCircle, Calendar, Clock } from "lucide-react";
import { TaskCompletionDialog } from "./TaskCompletionDialog";
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

interface TaskAppointmentActionsProps {
  task: Task;
  myOffer: Offer | undefined;
  isMyOfferAccepted: boolean;
  onChatWithClient: () => void;
  onTaskUpdate?: () => void;
  onTaskCompleted?: () => void;
}

export const TaskAppointmentActions = ({ 
  task, 
  myOffer, 
  isMyOfferAccepted, 
  onChatWithClient, 
  onTaskUpdate, 
  onTaskCompleted 
}: TaskAppointmentActionsProps) => {
  if (!isMyOfferAccepted || task.status !== "accepted") {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="bg-green-50 p-4 rounded-lg">
        <p className="text-sm text-green-700 font-medium">✅ Appointment Scheduled</p>
        {myOffer && (
          <div className="text-sm text-gray-700 mt-2">
            <div className="flex items-center space-x-2 mb-1">
              <Calendar className="h-4 w-4" />
              <span>Date: {myOffer.proposed_date}</span>
            </div>
            <div className="flex items-center space-x-2 mb-1">
              <Clock className="h-4 w-4" />
              <span>Time: {myOffer.proposed_time}</span>
            </div>
            <div>Price: £{myOffer.price}</div>
          </div>
        )}
      </div>
      
      <div className="flex gap-2">
        <Button 
          variant="outline" 
          className="flex-1"
          onClick={onChatWithClient}
        >
          <MessageCircle className="h-4 w-4 mr-2" />
          Chat with Client
        </Button>
        
        <TaskCompletionDialog
          taskId={task.id}
          taskStatus={task.status}
          isMyOfferAccepted={isMyOfferAccepted}
          onTaskUpdate={onTaskUpdate}
          onTaskCompleted={onTaskCompleted}
        />
      </div>
    </div>
  );
};
