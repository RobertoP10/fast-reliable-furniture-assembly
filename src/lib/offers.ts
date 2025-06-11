import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Offer = Database["public"]["Tables"]["offers"]["Row"] & {
  tasker?: {
    full_name: string;
    approved?: boolean;
  };
};

export const fetchOffers = async (taskId: string): Promise<Offer[]> => {
  console.log("🔍 [OFFERS] Fetching offers for task:", taskId);
  
  // Ensure we have a valid session
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError || !session) {
    console.error("❌ [OFFERS] No valid session:", sessionError);
    throw new Error("Authentication required");
  }

  console.log("✅ [OFFERS] Session validated, making request with user ID:", session.user.id);

  const { data, error } = await supabase
    .from("offers")
    .select(`*, tasker:users!offers_tasker_id_fkey(full_name, approved)`)
    .eq("task_id", taskId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("❌ [OFFERS] RLS Error fetching offers:", error);
    console.error("❌ [OFFERS] Error details:", {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint
    });
    throw new Error(`Failed to fetch offers: ${error.message}`);
  }

  console.log("✅ [OFFERS] Fetched offers:", data?.length || 0, "for task:", taskId);
  return data || [];
};

export const fetchUserOffers = async (userId: string): Promise<Offer[]> => {
  console.log("🔍 [OFFERS] Fetching user offers for:", userId);
  
  // Ensure we have a valid session
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError || !session) {
    console.error("❌ [OFFERS] No valid session for user offers:", sessionError);
    throw new Error("Authentication required");
  }

  console.log("✅ [OFFERS] Session validated for user offers, session user ID:", session.user.id);

  // Verify the passed userId matches the session user ID
  if (session.user.id !== userId) {
    console.error("❌ [OFFERS] User ID mismatch. Session:", session.user.id, "Passed:", userId);
    throw new Error("User ID mismatch");
  }

  // Use explicit filter with the validated user ID instead of relying on RLS
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

  if (error) {
    console.error("❌ [OFFERS] Error fetching user offers:", error);
    console.error("❌ [OFFERS] Error details:", {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint
    });
    throw new Error(`Failed to fetch user offers: ${error.message}`);
  }

  console.log("✅ [OFFERS] Fetched user offers:", data?.length || 0, "for user:", userId);
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
  console.log("🔄 [OFFERS] Creating offer:", offerData);
  
  // Ensure we have a valid session
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError || !session) {
    console.error("❌ [OFFERS] No valid session for offer creation:", sessionError);
    throw new Error("Authentication required");
  }

  const { data, error } = await supabase
    .from("offers")
    .insert(offerData)
    .select()
    .single();

  if (error) {
    console.error("❌ [OFFERS] Error creating offer:", error);
    throw new Error(`Failed to create offer: ${error.message}`);
  }

  console.log("✅ [OFFERS] Created offer:", data.id);
  return data;
};

// ✅ Accept one offer & reject the rest with proper status handling
export const acceptOffer = async (
  taskId: string,
  offerId: string
): Promise<{ success: boolean; error?: any }> => {
  try {
    console.log("🔄 [OFFERS] Accepting offer:", offerId, "for task:", taskId);
    
    // Ensure we have a valid session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      console.error("❌ [OFFERS] No valid session for offer acceptance:", sessionError);
      return { success: false, error: "Authentication required" };
    }

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
  console.log("🔄 [OFFERS] Declining offer:", offerId);
  
  // Ensure we have a valid session
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError || !session) {
    console.error("❌ [OFFERS] No valid session for offer decline:", sessionError);
    return { success: false, error: "Authentication required" };
  }

  const { error } = await supabase
    .from("offers")
    .update({ is_accepted: false, status: 'rejected' })
    .eq("id", offerId);

  if (error) {
    console.error("❌ [OFFERS] Error declining offer:", error);
    return { success: false, error };
  }

  console.log("✅ [OFFERS] Declined offer:", offerId);
  return { success: true };
};
