
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Offer = Database["public"]["Tables"]["offers"]["Row"] & {
  tasker?: {
    full_name: string;
    approved?: boolean;
  };
};

export const fetchOffers = async (taskId: string): Promise<Offer[]> => {
  const { data, error } = await supabase
    .from("offers")
    .select(`*, tasker:users!offers_tasker_id_fkey(full_name, approved)`)
    .eq("task_id", taskId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Failed to fetch offers: ${error.message}`);
  return data || [];
};

export const fetchUserOffers = async (userId: string): Promise<Offer[]> => {
  const { data, error } = await supabase
    .from("offers")
    .select(`
      *,
      task:task_requests!offers_task_id_fkey(
        id, title, description, location, status, created_at
      )
    `)
    .eq("tasker_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Failed to fetch user offers: ${error.message}`);
  return data || [];
};

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

// ✅ Accept one offer & reject the rest with proper status handling
export const acceptOffer = async (
  taskId: string,
  offerId: string
): Promise<{ success: boolean; error?: any }> => {
  try {
    // Use the RPC function to handle the entire accept/reject flow atomically
    const { data, error } = await supabase.rpc('accept_offer_and_reject_others', {
      offer_id_param: offerId,
      task_id_param: taskId
    });

    if (error) {
      console.error("❌ [OFFERS] Error in acceptOffer:", error);
      return { success: false, error: error.message };
    }

    if (!data) {
      return { success: false, error: "Failed to accept offer" };
    }

    console.log("✅ [OFFERS] Offer accepted successfully via RPC");
    return { success: true };
  } catch (error) {
    console.error("❌ [OFFERS] Unexpected error in acceptOffer:", error);
    return { success: false, error: (error as Error).message };
  }
};

// ✅ Decline only one offer
export const declineOffer = async (
  offerId: string
): Promise<{ success: boolean; error?: any }> => {
  const { error } = await supabase
    .from("offers")
    .update({ is_accepted: false, status: 'rejected' })
    .eq("id", offerId);

  if (error) {
    console.error("❌ [OFFERS] Error declining offer:", error);
    return { success: false, error };
  }

  return { success: true };
};
