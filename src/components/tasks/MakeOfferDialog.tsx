
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { createOffer } from "@/lib/offers";
import { useAuth } from "@/contexts/AuthContext";

interface MakeOfferDialogProps {
  openTaskId: string | null;
  onClose: () => void;
}

const MakeOfferDialog = ({ openTaskId, onClose }: MakeOfferDialogProps) => {
  const { user } = useAuth();
  const [offerPrice, setOfferPrice] = useState('');
  const [offerMessage, setOfferMessage] = useState('');
  const [availableDate, setAvailableDate] = useState('');
  const [availableTime, setAvailableTime] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!openTaskId || !user || !offerPrice || !availableDate || !availableTime) return;
    
    setIsSubmitting(true);
    try {
      await createOffer({
        task_id: openTaskId,
        tasker_id: user.id,
        price: parseFloat(offerPrice),
        message: offerMessage,
        available_date: availableDate,
        available_time: availableTime,
      });
      
      // Reset form
      setOfferPrice('');
      setOfferMessage('');
      setAvailableDate('');
      setAvailableTime('');
      onClose();
    } catch (error) {
      console.error('Error creating offer:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={!!openTaskId} onOpenChange={() => onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Make an Offer</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="price">Price (£)</Label>
            <Input
              id="price"
              type="number"
              value={offerPrice}
              onChange={(e) => setOfferPrice(e.target.value)}
              placeholder="Enter your price"
            />
          </div>
          <div>
            <Label htmlFor="message">Message to Client</Label>
            <Textarea
              id="message"
              value={offerMessage}
              onChange={(e) => setOfferMessage(e.target.value)}
              placeholder="Describe your experience and approach"
            />
          </div>
          <div>
            <Label htmlFor="date">Available Date</Label>
            <Input
              id="date"
              type="date"
              value={availableDate}
              onChange={(e) => setAvailableDate(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="time">Available Time</Label>
            <Input
              id="time"
              type="time"
              value={availableTime}
              onChange={(e) => setAvailableTime(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting || !offerPrice || !availableDate || !availableTime}
          >
            {isSubmitting ? 'Sending...' : 'Send Offer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MakeOfferDialog;
