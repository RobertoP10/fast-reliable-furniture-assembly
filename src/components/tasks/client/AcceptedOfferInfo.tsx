
import type { Database } from "@/integrations/supabase/types";

type Offer = Database["public"]["Tables"]["offers"]["Row"] & {
  tasker?: { full_name: string; approved?: boolean; created_at?: string; updated_at?: string };
};

interface AcceptedOfferInfoProps {
  acceptedOffer: Offer;
}

export const AcceptedOfferInfo = ({ acceptedOffer }: AcceptedOfferInfoProps) => {
  return (
    <div className="bg-green-50 p-4 rounded-lg">
      <p className="text-sm text-green-700 font-medium">✅ Offer Accepted</p>
      <p className="text-sm text-gray-600">Tasker: {acceptedOffer.tasker?.full_name}</p>
      <p className="text-sm text-gray-600">Price: £{acceptedOffer.price}</p>
      {acceptedOffer.proposed_date && (
        <p className="text-sm text-gray-600">
          Scheduled: {acceptedOffer.proposed_date} at {acceptedOffer.proposed_time}
        </p>
      )}
    </div>
  );
};
