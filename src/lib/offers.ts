
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
    console.error("❌ [OFFERS] Error fetching offers:", error);
    throw new Error(`Failed to fetch offers: ${error.message}`);
  }

  return data || [];
};

// ✅ Fetch offers created by a specific tasker
export const fetchUserOffers = async (userId: string): Promise<Offer[]> => {
  const { data, error } = await supabase
    .from("offers")
    .select(
      `*,
       task:task_requests!offers_task_id_fkey(
         id, title, description, location, status, created_at
       )
      `
    )
    .eq("tasker_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("❌ [OFFERS] Error fetching user offers:", error);
    throw new Error(`Failed to fetch user offers: ${error.message}`);
  }

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

  if (error) {
    console.error("❌ [OFFERS] Error creating offer:", error);
    throw new Error(`Failed to create offer: ${error.message}`);
  }

  return data;
};

// ✅ Accept one offer and reject all others for a task
export const acceptOffer = async (
  taskId: string,
  offerId: string
): Promise<{ success: boolean; error?: any }> => {
  const { error: resetError } = await supabase
    .from("offers")
    .update({ is_accepted: false })
    .eq("task_id", taskId);

  if (resetError) {
    console.error("❌ [OFFERS] Error resetting offers:", resetError);
    return { success: false, error: resetError };
  }

  const { error: acceptError } = await supabase
    .from("offers")
    .update({ is_accepted: true })
    .eq("id", offerId);

  if (acceptError) {
    console.error("❌ [OFFERS] Error accepting offer:", acceptError);
    return { success: false, error: acceptError };
  }

  const { error: taskError } = await supabase
    .from("task_requests")
    .update({ status: "accepted" })
    .eq("id", taskId);

  if (taskError) {
    console.error("❌ [OFFERS] Error updating task status:", taskError);
    return { success: false, error: taskError };
  }

  return { success: true };
};

// ✅ Optional: Decline a single offer manually
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
