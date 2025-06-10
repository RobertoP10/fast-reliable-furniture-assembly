
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createOffer } from "@/lib/offers";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { fetchTask } from "@/lib/tasks";
import { useEffect } from "react";
import type { Database } from "@/integrations/supabase/types";

type Task = Database["public"]["Tables"]["task_requests"]["Row"];

interface MakeOfferDialogProps {
  taskId: string;
  onOfferCreated?: () => void;
}

const MakeOfferDialog = ({ taskId, onOfferCreated }: MakeOfferDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [open, setOpen] = useState(true);
  const [price, setPrice] = useState("");
  const [message, setMessage] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [loading, setLoading] = useState(false);
  const [task, setTask] = useState<Task | null>(null);

  useEffect(() => {
    const loadTask = async () => {
      try {
        const taskData = await fetchTask(taskId);
        setTask(taskData);
      } catch (error) {
        console.error("Error loading task:", error);
      }
    };
    loadTask();
  }, [taskId]);

  const validateDate = () => {
    if (!date || !time || !task?.required_date || !task?.required_time) return true;
    
    const proposedDateTime = new Date(`${date}T${time}`);
    const requiredDateTime = new Date(`${task.required_date}T${task.required_time}`);
    const now = new Date();
    
    if (proposedDateTime < now) {
      toast({ title: "Cannot propose a date/time in the past", variant: "destructive" });
      return false;
    }
    
    if (proposedDateTime > requiredDateTime) {
      toast({ 
        title: "Proposed date/time must be before or on the required date/time", 
        variant: "destructive" 
      });
      return false;
    }
    
    return true;
  };

  const handleSubmit = async () => {
    if (!price || !date || !time) {
      toast({ title: "All fields are required", variant: "destructive" });
      return;
    }

    if (!validateDate()) {
      return;
    }

    try {
      setLoading(true);

      await createOffer({
        task_id: taskId,
        tasker_id: user!.id,
        price: Number(price),
        message,
        proposed_date: date,
        proposed_time: time,
      });

      toast({ title: "✅ Offer sent successfully!" });

      setOpen(false);

      if (onOfferCreated) {
        await new Promise((resolve) => setTimeout(resolve, 300));
        onOfferCreated();
      }

      setPrice("");
      setMessage("");
      setDate("");
      setTime("");
    } catch (error) {
      toast({ title: "❌ Failed to send offer", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent aria-describedby="make-offer-description">
        <div id="make-offer-description" className="sr-only">
          Fill out the form below to submit your offer to the client.
        </div>

        <DialogHeader>
          <DialogTitle>Submit Your Offer</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {task && (
            <div className="bg-blue-50 p-3 rounded-lg text-sm">
              <p><strong>Task:</strong> {task.title}</p>
              <p><strong>Budget:</strong> £{task.price_range_min} - £{task.price_range_max}</p>
              {task.required_date && task.required_time && (
                <p><strong>Required by:</strong> {new Date(task.required_date).toLocaleDateString()} at {task.required_time}</p>
              )}
            </div>
          )}

          <div>
            <Label>Offer Price (£)</Label>
            <Input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="Enter your offer"
              min={1}
            />
          </div>

          <div>
            <Label>Message (optional)</Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Message to client"
            />
          </div>

          <div>
            <Label>Available Date</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>

          <div>
            <Label>Available Time</Label>
            <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          </div>

          <Button disabled={loading} onClick={handleSubmit} className="w-full mt-2">
            {loading ? "Sending..." : "Submit Offer"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MakeOfferDialog;
