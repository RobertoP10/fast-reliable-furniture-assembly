import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CheckCircle, Upload, MessageCircle, Calendar, Clock } from "lucide-react";
import { completeTask } from "@/lib/tasks";
import { useToast } from "@/hooks/use-toast";
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
}

export const TaskTaskerActions = ({ task, user, activeTab, onMakeOffer, onTaskUpdate }: TaskTaskerActionsProps) => {
  const { toast } = useToast();
  const [showProofDialog, setShowProofDialog] = useState(false);
  const [proofFiles, setProofFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const myOffer = task.offers?.find((offer) => offer.tasker_id === user.id);
  const hasOffered = !!myOffer;
  const isMyOfferAccepted = myOffer && task.accepted_offer_id === myOffer.id;

  const handleCompleteTask = async () => {
    if (proofFiles.length === 0) {
      toast({ title: "Please upload at least one proof photo", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      // TODO: Implement file upload to Supabase storage
      // For now, we'll just complete without proof URLs
      const result = await completeTask(task.id);
      if (result.success) {
        toast({ title: "✅ Task marked as completed" });
        setShowProofDialog(false);
        setProofFiles([]);
        onTaskUpdate?.();
      } else {
        toast({ 
          title: "❌ Failed to complete task", 
          description: result.error,
          variant: "destructive" 
        });
      }
    } catch (error) {
      toast({ 
        title: "❌ Error completing task", 
        description: "Please try again",
        variant: "destructive" 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setProofFiles(Array.from(e.target.files));
    }
  };

  const getOfferStatus = (offer: Offer) => {
    // Check if this offer is the accepted one for the task
    if (task.accepted_offer_id === offer.id) return "Accepted";
    // If task has an accepted offer but it's not this one, then this offer is rejected
    if (task.accepted_offer_id && task.accepted_offer_id !== offer.id) return "Rejected";
    // Otherwise it's still pending
    return "Pending";
  };

  // Available Tasks tab - show Make Offer button only if no offer submitted yet
  if (activeTab === "available" && !hasOffered) {
    return (
      <Button onClick={onMakeOffer} className="bg-blue-600 hover:bg-blue-700">
        Make an Offer
      </Button>
    );
  }

  // Appointments tab - show appointment details and chat/completion options
  if (activeTab === "appointments" && isMyOfferAccepted) {
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
          <Button variant="outline" className="flex-1">
            <MessageCircle className="h-4 w-4 mr-2" />
            Chat with Client
          </Button>
          
          <Dialog open={showProofDialog} onOpenChange={setShowProofDialog}>
            <DialogTrigger asChild>
              <Button className="bg-green-600 hover:bg-green-700 flex-1">
                <CheckCircle className="h-4 w-4 mr-2" />
                Complete Task
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Complete Task</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="proof-photos">Upload Proof Photos</Label>
                  <Input
                    id="proof-photos"
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileChange}
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Upload photos showing the completed work
                  </p>
                </div>
                
                {proofFiles.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Selected files:</p>
                    {proofFiles.map((file, index) => (
                      <p key={index} className="text-sm text-gray-600">{file.name}</p>
                    ))}
                  </div>
                )}
                
                <Button 
                  onClick={handleCompleteTask} 
                  disabled={isSubmitting || proofFiles.length === 0}
                  className="w-full"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {isSubmitting ? "Completing..." : "Complete Task"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    );
  }

  // Completed tab - just show the completion details
  if (activeTab === "completed" && task.status === "completed" && isMyOfferAccepted) {
    return (
      <div className="bg-green-50 p-4 rounded-lg">
        <p className="text-sm text-green-700 font-medium">✅ Task Completed</p>
        <p className="text-sm text-gray-600">Completed at: {task.completed_at ? new Date(task.completed_at).toLocaleDateString() : 'N/A'}</p>
        {myOffer && (
          <p className="text-sm text-gray-600">Earned: £{myOffer.price}</p>
        )}
      </div>
    );
  }

  return null;
};
