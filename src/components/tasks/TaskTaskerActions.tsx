import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CheckCircle, Upload, MessageCircle, Calendar, Clock } from "lucide-react";
import { completeTask } from "@/lib/tasks";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
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
  const { toast } = useToast();
  const [showProofDialog, setShowProofDialog] = useState(false);
  const [proofFiles, setProofFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const myOffer = task.offers?.find((offer) => offer.tasker_id === user.id);
  const hasOffered = !!myOffer;
  const isMyOfferAccepted = myOffer && task.accepted_offer_id === myOffer.id && myOffer.status === 'accepted';

  const uploadProofImages = async (files: File[]): Promise<string[]> => {
    const uploadPromises = files.map(async (file) => {
      const fileExt = file.name.split('.').pop();
      const fileName = `${task.id}/${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('task-proofs')
        .upload(fileName, file);

      if (error) {
        console.error('Error uploading file:', error);
        throw error;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('task-proofs')
        .getPublicUrl(fileName);

      return publicUrl;
    });

    return Promise.all(uploadPromises);
  };

  const handleCompleteTask = async () => {
    if (proofFiles.length === 0) {
      toast({ 
        title: "❌ Images required", 
        description: "Please upload at least one proof photo before completing the task",
        variant: "destructive" 
      });
      return;
    }

    if (task.status !== 'accepted') {
      toast({ 
        title: "❌ Cannot complete task", 
        description: "Task must be in 'accepted' status to be completed",
        variant: "destructive" 
      });
      return;
    }

    if (!isMyOfferAccepted) {
      toast({ 
        title: "❌ Cannot complete task", 
        description: "Only the accepted tasker can complete this task",
        variant: "destructive" 
      });
      return;
    }

    setIsSubmitting(true);
    try {
      console.log('🔄 [TASK] Uploading proof images...');
      
      // Upload images to Supabase Storage
      const proofUrls = await uploadProofImages(proofFiles);
      console.log('✅ [TASK] Images uploaded:', proofUrls);

      // Complete the task with proof URLs
      const result = await completeTask(task.id, proofUrls);
      
      if (result.success) {
        toast({ 
          title: "✅ Task completed successfully!",
          description: "Proof images have been uploaded and the task is marked as completed."
        });
        setShowProofDialog(false);
        setProofFiles([]);
        onTaskUpdate?.();
      } else {
        toast({ 
          title: "❌ Failed to complete task", 
          description: result.error || "Please try again",
          variant: "destructive" 
        });
      }
    } catch (error) {
      console.error('❌ [TASK] Error completing task:', error);
      toast({ 
        title: "❌ Error completing task", 
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive" 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      if (files.length > 5) {
        toast({ 
          title: "⚠️ Too many files", 
          description: "Please select up to 5 images only",
          variant: "destructive" 
        });
        return;
      }
      
      // Validate file types
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
      const invalidFiles = files.filter(file => !validTypes.includes(file.type));
      
      if (invalidFiles.length > 0) {
        toast({ 
          title: "⚠️ Invalid file type", 
          description: "Please select only JPG or PNG images",
          variant: "destructive" 
        });
        return;
      }
      
      setProofFiles(files);
    }
  };

  const getOfferStatusDisplay = (offer: Offer) => {
    // Use offer.status directly from database for accurate status
    switch (offer.status) {
      case 'accepted':
        return { text: "Accepted", color: "bg-green-50 text-green-700" };
      case 'rejected':
        return { text: "Not Selected", color: "bg-red-50 text-red-700" };
      case 'pending':
      default:
        return { text: "Pending", color: "bg-yellow-50 text-yellow-700" };
    }
  };

  const handleChatWithClient = () => {
    if (onChatWithClient && task.client_id) {
      onChatWithClient(task.id, task.client_id);
    }
  };

  // Available Tasks tab - show Make Offer button only if no offer submitted yet
  if (activeTab === "available" && !hasOffered) {
    return (
      <Button onClick={onMakeOffer} className="bg-blue-600 hover:bg-blue-700">
        Make an Offer
      </Button>
    );
  }

  // My Offers tab - show offer status and details (only pending/rejected offers)
  if (activeTab === "my-tasks" && myOffer) {
    const statusDisplay = getOfferStatusDisplay(myOffer);
    return (
      <div className="space-y-3">
        <div className={`p-3 rounded-lg ${statusDisplay.color}`}>
          <p className="font-medium">Your Offer: {statusDisplay.text}</p>
          <p className="text-sm">Price: £{myOffer.price}</p>
          {myOffer.proposed_date && (
            <p className="text-sm">Date: {myOffer.proposed_date} at {myOffer.proposed_time}</p>
          )}
          {myOffer.message && (
            <p className="text-sm italic mt-1">"{myOffer.message}"</p>
          )}
        </div>
      </div>
    );
  }

  // Appointments tab - show appointment details and actions (only for accepted offers)
  if (activeTab === "appointments" && isMyOfferAccepted && task.status === "accepted") {
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
            onClick={handleChatWithClient}
          >
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
                  <Label htmlFor="proof-photos">Upload Proof Photos (Required)</Label>
                  <Input
                    id="proof-photos"
                    type="file"
                    multiple
                    accept="image/jpeg,image/jpg,image/png"
                    onChange={handleFileChange}
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Upload 1-5 photos showing the completed work (JPG, PNG only)
                  </p>
                </div>
                
                {proofFiles.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Selected files ({proofFiles.length}/5):</p>
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
                  {isSubmitting ? "Uploading & Completing..." : "Complete Task"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    );
  }

  // Completed tab - show completion details (only for completed tasks where this tasker was accepted)
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
