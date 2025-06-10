
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CheckCircle, Upload } from "lucide-react";
import { completeTask } from "@/lib/api";
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
    if (offer.is_accepted === true) return "Accepted";
    if (offer.is_accepted === false) return "Rejected";
    return "Pending";
  };

  // Available Tasks tab
  if (activeTab === "available" && !hasOffered) {
    return (
      <Button onClick={onMakeOffer} className="bg-blue-600 hover:bg-blue-700">
        Make an Offer
      </Button>
    );
  }

  // My Offers tab
  if (activeTab === "my-tasks" && myOffer) {
    const offerStatus = getOfferStatus(myOffer);
    
    return (
      <div className="space-y-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-gray-700">
            <strong>Your Offer:</strong> £{myOffer.price} on {myOffer.proposed_date} at {myOffer.proposed_time}
          </p>
          <p className="text-sm mt-1">
            <strong>Status:</strong> <span className={`font-medium ${
              offerStatus === "Accepted" ? "text-green-600" : 
              offerStatus === "Rejected" ? "text-red-600" : "text-yellow-600"
            }`}>{offerStatus}</span>
          </p>
          {myOffer.message && (
            <p className="text-sm mt-1"><strong>Message:</strong> {myOffer.message}</p>
          )}
        </div>
        
        {task.status === "accepted" && myOffer.is_accepted && (
          <Dialog open={showProofDialog} onOpenChange={setShowProofDialog}>
            <DialogTrigger asChild>
              <Button className="bg-green-600 hover:bg-green-700">
                <CheckCircle className="h-4 w-4 mr-2" />
                Mark as Completed
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
        )}
      </div>
    );
  }

  return null;
};
