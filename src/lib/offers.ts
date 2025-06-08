import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Offer = Database["public"]["Tables"]["offers"]["Row"] & {
  tasker?: {
    full_name: string;
    approved?: boolean;
  };
};

// ✅ Fetch offers for a specific task
export const fetchOffers = async (taskId: string): Promise<Offer[]> => {
  const { data, error } = await supabase
    .from("offers")
    .select(`*, tasker:users!offers_tasker_id_fkey(full_name, approved)`)
    .eq("task_id", taskId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Failed to fetch offers: ${error.message}`);
  return data || [];
};

// ✅ Create a new offer
export const createOffer = async (offerData: {
  task_id: string;
  tasker_id: string;
  price: number;
  message?: string;
  proposed_date: string;
  proposed_time: string;
}): Promise<Offer> => {
  const { data, error } = await supabase
    .from("offers")
    .insert(offerData)
    .select()
    .single();

  if (error) throw new Error(`Failed to create offer: ${error.message}`);
  return data;
};

// ✅ Accept a specific offer and reject all others for the same task
export const acceptOffer = async (
  taskId: string,
  offerId: string
): Promise<{ success: boolean; error?: any }> => {
  try {
    console.log("🔧 Accepting offer:", offerId, "for task:", taskId);

    const { error: acceptError } = await supabase
      .from("offers")
      .update({ is_accepted: true })
      .eq("id", offerId);

    if (acceptError) {
      console.error("❌ acceptOffer -> acceptError", acceptError);
      throw acceptError;
    }

    const { error: rejectOthersError } = await supabase
      .from("offers")
      .update({ is_accepted: false })
      .eq("task_id", taskId)
      .neq("id", offerId);

    if (rejectOthersError) {
      console.error("❌ acceptOffer -> rejectOthersError", rejectOthersError);
      throw rejectOthersError;
    }

    const { error: taskError } = await supabase
      .from("task_requests")
      .update({ status: "accepted" })
      .eq("id", taskId);

    if (taskError) {
      console.error("❌ acceptOffer -> taskError", taskError);
      throw taskError;
    }

    return { success: true };
  } catch (error) {
    return { success: false, error };
  }
};

// ✅ Decline an individual offer
export const declineOffer = async (
  offerId: string
): Promise<{ success: boolean; error?: any }> => {
  const { error } = await supabase
    .from("offers")
    .update({ is_accepted: false })
    .eq("id", offerId);

  if (error) {
    console.error("❌ Error declining offer:", error);
    return { success: false, error };
  }

  return { success: true };
};
