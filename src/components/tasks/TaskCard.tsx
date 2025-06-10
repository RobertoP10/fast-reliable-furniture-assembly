
import { Card, CardContent } from "@/components/ui/card";
import { TaskCardHeader } from "./TaskCardHeader";
import { TaskCardInfo } from "./TaskCardInfo";
import { TaskClientActions } from "./TaskClientActions";
import { TaskTaskerActions } from "./TaskTaskerActions";
import { TaskCompletionProof } from "./TaskCompletionProof";
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

interface TaskCardProps {
  task: Task;
  userRole: "client" | "tasker";
  user: any;
  onAccept: (taskId: string, offerId: string) => void;
  onMakeOffer: () => void;
  onTaskUpdate?: () => void;
  activeTab?: string;
}

export const TaskCard = ({ task, userRole, user, onAccept, onMakeOffer, onTaskUpdate, activeTab }: TaskCardProps) => {
  return (
    <Card className="shadow-lg border-0 hover:shadow-xl transition-all duration-300">
      <TaskCardHeader task={task} />
      <CardContent>
        <TaskCardInfo task={task} />

        {userRole === "client" && (
          <TaskClientActions 
            task={task} 
            user={user} 
            activeTab={activeTab} 
            onAccept={onAccept} 
            onTaskUpdate={onTaskUpdate} 
          />
        )}
        
        {userRole === "tasker" && (
          <TaskTaskerActions 
            task={task} 
            user={user} 
            activeTab={activeTab} 
            onMakeOffer={onMakeOffer} 
            onTaskUpdate={onTaskUpdate} 
          />
        )}

        <TaskCompletionProof proofUrls={task.completion_proof_urls} />
      </CardContent>
    </Card>
  );
};
