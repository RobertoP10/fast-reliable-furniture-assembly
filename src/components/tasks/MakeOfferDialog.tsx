
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createOffer } from "@/lib/offers";
import { fetchTask } from "@/lib/tasks";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface MakeOfferDialogProps {
  taskId: string;
  onOfferCreated: () => void;
}

const MakeOfferDialog = ({ taskId, onOfferCreated }: MakeOfferDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [task, setTask] = useState<any>(null);
  const [formData, setFormData] = useState({
    price: "",
    message: "",
    proposedDate: "",
    proposedTime: "",
  });

  // Load task details when dialog opens
  useState(() => {
    const loadTask = async () => {
      try {
        const taskData = await fetchTask(taskId);
        setTask(taskData);
      } catch (error) {
        console.error("Error loading task:", error);
      }
    };
    
    if (taskId) {
      loadTask();
    }
  });

  const validateDateTime = () => {
    if (!formData.proposedDate || !formData.proposedTime) {
      return "Please select both date and time";
    }

    const proposedDateTime = new Date(`${formData.proposedDate}T${formData.proposedTime}`);
    const now = new Date();
    
    // Check if proposed date/time is in the past
    if (proposedDateTime <= now) {
      return "Proposed date and time must be in the future";
    }

    // Check if proposed date/time is before task's required date
    if (task?.required_date) {
      const requiredDateTime = new Date(task.required_date);
      if (task.required_time) {
        const [hours, minutes] = task.required_time.split(':');
        requiredDateTime.setHours(parseInt(hours), parseInt(minutes));
      }
      
      if (proposedDateTime > requiredDateTime) {
        return "Proposed date and time must be on or before the task's required date";
      }
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.id) {
      toast({ title: "Please log in to make an offer", variant: "destructive" });
      return;
    }

    // Validate date/time
    const validationError = validateDateTime();
    if (validationError) {
      toast({ title: validationError, variant: "destructive" });
      return;
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      toast({ title: "Please enter a valid price", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      await createOffer({
        task_id: taskId,
        tasker_id: user.id,
        price: parseFloat(formData.price),
        message: formData.message || undefined,
        proposed_date: formData.proposedDate,
        proposed_time: formData.proposedTime,
      });

      toast({ title: "✅ Offer submitted successfully!" });
      setIsOpen(false);
      onOfferCreated();
    } catch (error) {
      console.error("Error creating offer:", error);
      toast({ 
        title: "❌ Failed to submit offer", 
        description: "Please try again",
        variant: "destructive" 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    onOfferCreated();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Make an Offer</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="price">Your Price (£)</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              min="0.01"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              placeholder="Enter your price"
              required
            />
          </div>

          <div>
            <Label htmlFor="proposed-date">Proposed Date</Label>
            <Input
              id="proposed-date"
              type="date"
              value={formData.proposedDate}
              onChange={(e) => setFormData({ ...formData, proposedDate: e.target.value })}
              min={new Date().toISOString().split('T')[0]}
              max={task?.required_date || undefined}
              required
            />
            {task?.required_date && (
              <p className="text-xs text-gray-500 mt-1">
                Must be on or before: {new Date(task.required_date).toLocaleDateString()}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="proposed-time">Proposed Time</Label>
            <Input
              id="proposed-time"
              type="time"
              value={formData.proposedTime}
              onChange={(e) => setFormData({ ...formData, proposedTime: e.target.value })}
              required
            />
            {task?.required_time && (
              <p className="text-xs text-gray-500 mt-1">
                Task required by: {task.required_time}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="message">Message (Optional)</Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="Add a message to explain your approach..."
              rows={3}
            />
          </div>

          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? "Submitting..." : "Submit Offer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default MakeOfferDialog;
