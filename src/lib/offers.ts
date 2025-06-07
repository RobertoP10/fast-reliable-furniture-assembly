import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Offer = Database["public"]["Tables"]["offers"]["Row"];

// ✅ Fetch all offers for a specific task (client view)
export const fetchOffers = async (taskId: string): Promise<Offer[]> => {
  console.log("🔍 [OFFERS] Fetching offers for task:", taskId);

  const { data, error } = await supabase
    .from("offers")
    .select(`
      *,
      tasker:users!offers_tasker_id_fkey(full_name, approved)
    `)
    .eq("task_id", taskId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("❌ [OFFERS] Error fetching offers:", error);
    throw new Error(`Failed to fetch offers: ${error.message}`);
  }

  console.log("✅ [OFFERS] Offers fetched:", data?.length || 0);
  return data || [];
};

// ✅ Fetch all offers created by a tasker
export const fetchUserOffers = async (userId: string): Promise<Offer[]> => {
  console.log("🔍 [OFFERS] Fetching offers by tasker:", userId);

  const { data, error } = await supabase
    .from("offers")
    .select(`
      *,
      task:task_requests!offers_task_id_fkey(
        id,
        title,
        description,
        location,
        status,
        created_at
      )
    `)
    .eq("tasker_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("❌ [OFFERS] Error fetching tasker offers:", error);
    throw new Error(`Failed to fetch offers: ${error.message}`);
  }

  console.log("✅ [OFFERS] Offers by user fetched:", data?.length || 0);
  return data || [];
};

// ✅ Create a new offer for a task
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
    .insert({
      task_id: offerData.task_id,
      tasker_id: offerData.tasker_id,
      price: offerData.price,
      message: offerData.message,
      proposed_date: offerData.proposed_date,
      proposed_time: offerData.proposed_time,
    })
    .select()
    .single();

  if (error) {
    console.error("❌ [OFFERS] Error creating offer:", error);
    throw new Error(`Failed to create offer: ${error.message}`);
  }

  console.log("✅ [OFFERS] Offer created:", data.id);
  return data;
};

// ✅ Accept one offer and reject all others for the same task
export const acceptOffer = async (
  taskId: string,
  offerId: string
): Promise<{ success: boolean; error?: any }> => {
  console.log("📝 [OFFERS] Accepting offer:", offerId, "for task:", taskId);

  // 1. Mark all offers for this task as not accepted
  const { error: resetError } = await supabase
    .from("offers")
    .update({ is_accepted: false })
    .eq("task_id", taskId);

  if (resetError) {
    console.error("❌ [OFFERS] Error resetting offers:", resetError);
    return { success: false, error: resetError };
  }

  // 2. Accept the selected offer
  const { error: acceptError } = await supabase
    .from("offers")
    .update({ is_accepted: true })
    .eq("id", offerId);

  if (acceptError) {
    console.error("❌ [OFFERS] Error accepting offer:", acceptError);
    return { success: false, error: acceptError };
  }

  // 3. Update the task's status to 'accepted'
  const { error: taskError } = await supabase
    .from("task_requests")
    .update({ status: "accepted" })
    .eq("id", taskId);

  if (taskError) {
    console.error("❌ [OFFERS] Error updating task status:", taskError);
    return { success: false, error: taskError };
  }

  console.log("✅ [OFFERS] Offer accepted successfully and task updated.");
  return { success: true };
};
