import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createOffer } from "@/lib/offers";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface MakeOfferDialogProps {
  taskId: string;
  onOfferCreated?: () => void;
}

const MakeOfferDialog = ({ taskId, onOfferCreated }: MakeOfferDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [open, setOpen] = useState<boolean>(true); // important: deschis by default când este montat
  const [price, setPrice] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [date, setDate] = useState<string>("");
  const [time, setTime] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  // resetare formular când se închide
  useEffect(() => {
    if (!open) {
      setPrice("");
      setMessage("");
      setDate("");
      setTime("");
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!price || !date || !time) {
      toast({ title: "All fields are required", variant: "destructive" });
      return;
    }

    try {
      setLoading(true);
      await createOffer({
        task_id: taskId,
        tasker_id: user!.id,
        price: Number(price),
        message,
        available_date: date,
        available_time: time,
      });

      toast({ title: "✅ Offer sent successfully!" });
      setOpen(false);
      onOfferCreated?.(); // notifică TasksList să reîncarce
    } catch (error) {
      console.error(error);
      toast({ title: "❌ Failed to send offer", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Submit Your Offer</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="price">Offer Price (£)</Label>
            <Input
              id="price"
              type="number"
              min="1"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="Enter your price in pounds"
              required
            />
          </div>

          <div>
            <Label htmlFor="message">Message (optional)</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Add an optional message to the client"
            />
          </div>

          <div>
            <Label htmlFor="date">Available Date</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="time">Available Time</Label>
            <Input
              id="time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              required
            />
          </div>

          <Button
            disabled={loading}
            onClick={handleSubmit}
            className="w-full mt-2"
          >
            {loading ? "Sending..." : "Submit Offer"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MakeOfferDialog;
