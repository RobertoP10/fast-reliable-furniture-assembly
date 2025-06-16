
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Offer = Database["public"]["Tables"]["offers"]["Row"] & {
  tasker?: { full_name: string; approved?: boolean; created_at?: string; updated_at?: string };
};

interface OffersListProps {
  offers: Offer[];
  onAccept: (taskId: string, offerId: string) => void;
  taskId: string;
}

export const OffersList = ({ offers, onAccept, taskId }: OffersListProps) => {
  return (
    <div className="space-y-3">
      <h4 className="font-semibold">Offers Received:</h4>
      {offers.map((offer) => (
        <div key={offer.id} className="border rounded-lg p-3 bg-blue-50">
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="font-medium">{offer.tasker?.full_name || "Tasker"}</p>
              <p className="text-sm text-gray-600">Price: £{offer.price}</p>
              {offer.proposed_date && (
                <p className="text-sm text-gray-600">
                  Date: {offer.proposed_date} at {offer.proposed_time}
                </p>
              )}
            </div>
            <Badge className="bg-yellow-100 text-yellow-700">
              {offer.tasker?.approved ? "Verified" : "Unverified"}
            </Badge>
          </div>
          {offer.message && (
            <p className="text-sm text-gray-700 mb-3 italic">"{offer.message}"</p>
          )}
          <Button 
            onClick={() => onAccept(taskId, offer.id)}
            className="bg-green-600 hover:bg-green-700 w-full"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Accept Offer
          </Button>
        </div>
      ))}
    </div>
  );
};
