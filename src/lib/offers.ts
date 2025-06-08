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

// ✅ Accept one offer & reject the rest
export const acceptOffer = async (
  taskId: string,
  offerId: string
): Promise<{ success: boolean; error?: any }> => {
  try {
    const { error: acceptError } = await supabase
      .from("offers")
      .update({ is_accepted: true })
      .eq("id", offerId);
    if (acceptError) throw acceptError;

    const { error: rejectOthersError } = await supabase
      .from("offers")
      .update({ is_accepted: false })
      .eq("task_id", taskId)
      .neq("id", offerId);
    if (rejectOthersError) throw rejectOthersError;

    const { error: taskError } = await supabase
      .from("task_requests")
      .update({ status: "accepted" })
      .eq("id", taskId);
    if (taskError) throw taskError;

    return { success: true };
  } catch (error) {
    console.error("❌ [OFFERS] Error in acceptOffer:", error);
    return { success: false, error };
  }
};

// ✅ Decline only one offer
export const declineOffer = async (
  offerId: string
): Promise<{ success: boolean; error?: any }> => {
  const { error } = await supabase
    .from("offers")
    .update({ is_accepted: false })
    .eq("id", offerId);

  if (error) {
    console.error("❌ [OFFERS] Error declining offer:", error);
    return { success: false, error };
  }

  return { success: true };
};
