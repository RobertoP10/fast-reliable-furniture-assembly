import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Offer = Database["public"]["Tables"]["offers"]["Row"] & {
  tasker?: {
    full_name: string;
    approved?: boolean;
  };
};

// ✅ Fetch offers for a specific task (with tasker full_name)
export const fetchOffers = async (taskId: string): Promise<Offer[]> => {
  const { data, error } = await supabase
    .from("offers")
    .select(
      `*,
       tasker:users!offers_tasker_id_fkey(full_name, approved)
      `
    )
    .eq("task_id", taskId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("❌ Error fetching offers:", error);
    return [];
  }

  return data ?? [];
};

// ✅ Submit a new offer
export const submitOffer = async (offer: {
  task_id: string;
  tasker_id: string;
  price: number;
  message?: string;
  proposed_date: string;
  proposed_time: string;
}): Promise<{ success: boolean; error?: string }> => {
  const { error } = await supabase.from("offers").insert([offer]);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
};

// ✅ Accept an offer
export const acceptOffer = async (
  taskId: string,
  offerId: string
): Promise<{ success: boolean; error?: string }> => {
  const { error: taskUpdateError } = await supabase
    .from("task_requests")
    .update({ accepted_offer_id: offerId, status: "accepted" })
    .eq("id", taskId);

  if (taskUpdateError) {
    return { success: false, error: taskUpdateError.message };
  }

  const { error: offerUpdateError } = await supabase
    .from("offers")
    .update({ is_accepted: true })
    .eq("id", offerId);

  if (offerUpdateError) {
    return { success: false, error: offerUpdateError.message };
  }

  return { success: true };
};
