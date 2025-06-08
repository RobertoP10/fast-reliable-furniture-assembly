import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type OfferInsert = Database["public"]["Tables"]["offers"]["Insert"];
type OfferUpdate = Database["public"]["Tables"]["offers"]["Update"];

export const createOffer = async (offer: OfferInsert) => {
  const { data, error } = await supabase
    .from("offers")
    .insert(offer)
    .select()
    .single();

  if (error) {
    console.error("❌ Error creating offer:", error);
    return { success: false, error };
  }

  return { success: true, data };
};

export const declineOffer = async (offerId: string) => {
  const { data, error } = await supabase
    .from("offers")
    .update({ is_accepted: false })
    .eq("id", offerId)
    .select()
    .single();

  if (error) {
    console.error("❌ Error declining offer:", error);
    return { success: false, error };
  }

  return { success: true, data };
};

export const acceptOffer = async (taskId: string, offerId: string) => {
  const { error } = await supabase
    .from("task_requests")
    .update({ accepted_offer_id: offerId, status: "in_progress" })
    .eq("id", taskId);

  if (error) {
    console.error("❌ Error accepting offer:", error);
    throw error;
  }
};
