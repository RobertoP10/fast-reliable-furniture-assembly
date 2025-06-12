
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CheckCircle, Upload } from "lucide-react";
import { completeTask } from "@/lib/tasks";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface TaskCompletionDialogProps {
  taskId: string;
  taskStatus: string;
  isMyOfferAccepted: boolean;
  onTaskUpdate?: () => void;
  onTaskCompleted?: () => void;
}

export const TaskCompletionDialog = ({ 
  taskId, 
  taskStatus, 
  isMyOfferAccepted, 
  onTaskUpdate, 
  onTaskCompleted 
}: TaskCompletionDialogProps) => {
  const { toast } = useToast();
  const [showProofDialog, setShowProofDialog] = useState(false);
  const [proofFiles, setProofFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const uploadProofImages = async (files: File[]): Promise<string[]> => {
    const uploadPromises = files.map(async (file) => {
      const fileExt = file.name.split('.').pop();
      const fileName = `${taskId}/${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('task-proofs')
        .upload(fileName, file);

      if (error) {
        console.error('Error uploading file:', error);
        throw error;
      }

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

    if (taskStatus !== 'accepted') {
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
      
      const proofUrls = await uploadProofImages(proofFiles);
      console.log('✅ [TASK] Images uploaded:', proofUrls);

      const result = await completeTask(taskId, proofUrls);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to complete task');
      }

      toast({ 
        title: "✅ Task completed successfully!",
        description: "Proof images have been uploaded and the task is marked as completed."
      });
      
      setShowProofDialog(false);
      setProofFiles([]);
      
      if (onTaskCompleted) {
        onTaskCompleted();
      }
      
      if (onTaskUpdate) {
        onTaskUpdate();
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

  return (
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
  );
};
