import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type OfferBase = Database["public"]["Tables"]["offers"]["Row"];
type InsertOffer = Database["public"]["Tables"]["offers"]["Insert"];
type UpdateOffer = Database["public"]["Tables"]["offers"]["Update"];

export type Offer = OfferBase & {
  tasker?: {
    full_name: string;
    approved?: boolean;
  };
};

// ✅ Creează ofertă
export const createOffer = async (
  offerData: Omit<InsertOffer, "id" | "created_at" | "updated_at">
): Promise<{ success: boolean; error?: string }> => {
  const { error } = await supabase.from("offers").insert(offerData);
  if (error) return { success: false, error: error.message };
  return { success: true };
};

// ✅ Acceptă ofertă (update is_accepted la true pentru oferta aleasă)
export const acceptOffer = async (
  taskId: string,
  offerId: string
): Promise<{ success: boolean; error?: string }> => {
  const { error: updateTaskError } = await supabase
    .from("task_requests")
    .update({ accepted_offer_id: offerId, status: "accepted" })
    .eq("id", taskId);

  const { error: updateOfferError } = await supabase
    .from("offers")
    .update({ is_accepted: true })
    .eq("id", offerId);

  // Respingem celelalte oferte
  const { error: rejectOthersError } = await supabase
    .from("offers")
    .update({ is_accepted: false })
    .eq("task_id", taskId)
    .neq("id", offerId);

  if (updateTaskError || updateOfferError || rejectOthersError) {
    return {
      success: false,
      error:
        updateTaskError?.message ||
        updateOfferError?.message ||
        rejectOthersError?.message,
    };
  }

  return { success: true };
};

// ✅ Fetch oferte pentru un task (cu tasker info)
export const fetchOffers = async (taskId: string): Promise<Offer[]> => {
  const { data, error } = await supabase
    .from("offers")
    .select(
      `*,
       tasker:users(full_name, approved)`
    )
    .eq("task_id", taskId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("❌ Error fetching offers:", error.message);
    return [];
  }

  return data as Offer[];
};
