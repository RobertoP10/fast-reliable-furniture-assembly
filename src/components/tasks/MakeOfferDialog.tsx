import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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

  const [open, setOpen] = useState(false);
  const [price, setPrice] = useState("");
  const [message, setMessage] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [loading, setLoading] = useState(false);

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

      toast({ title: "Offer sent successfully!" });
      setOpen(false);
      onOfferCreated?.();
    } catch (error) {
      toast({ title: "Failed to send offer", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default">Make an Offer</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Submit Your Offer</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Offer Price (£)</Label>
            <Input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="Enter your offer"
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
