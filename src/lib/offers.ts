
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { validateSession } from "./session-validator";

type Offer = Database["public"]["Tables"]["offers"]["Row"] & {
  tasker?: {
    full_name: string;
    approved?: boolean;
  };
  task?: {
    id: string;
    title: string;
    description: string;
    location: string;
    status: string;
    created_at: string;
  };
};

export const fetchOffers = async (taskId: string): Promise<Offer[]> => {
  console.log("🔍 [OFFERS] Fetching offers for task:", taskId);
  
  // Validate session
  const sessionValidation = await validateSession();
  if (!sessionValidation.isValid) {
    console.error("❌ [OFFERS] Session validation failed:", sessionValidation.error);
    throw new Error("Authentication required");
  }

  console.log("✅ [OFFERS] Session validated, making request with user ID:", sessionValidation.userId);

  try {
    const { data, error } = await supabase
      .from("offers")
      .select(`
        *,
        tasker:users!tasker_id(full_name, approved)
      `)
      .eq("task_id", taskId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("❌ [OFFERS] Error fetching offers:", error);
      throw new Error(`Failed to fetch offers: ${error.message}`);
    }

    console.log("✅ [OFFERS] Fetched offers:", data?.length || 0, "for task:", taskId);
    return data || [];
  } catch (error) {
    console.error("❌ [OFFERS] Exception in fetchOffers:", error);
    throw error;
  }
};

export const fetchUserOffers = async (userId: string): Promise<Offer[]> => {
  console.log("🔍 [OFFERS] Fetching user offers for:", userId);
  
  // Validate session
  const sessionValidation = await validateSession();
  if (!sessionValidation.isValid || !sessionValidation.userId) {
    console.error("❌ [OFFERS] Session validation failed for user offers:", sessionValidation.error);
    throw new Error("Authentication required");
  }

  // Verify the passed userId matches the session user ID
  if (sessionValidation.userId !== userId) {
    console.error("❌ [OFFERS] User ID mismatch. Session:", sessionValidation.userId, "Passed:", userId);
    throw new Error("User ID mismatch");
  }

  console.log("✅ [OFFERS] Session validated for user offers, fetching for user:", userId);

  try {
    const { data, error } = await supabase
      .from("offers")
      .select(`
        *,
        task:task_requests!task_id(
          id, title, description, location, status, created_at
        )
      `)
      .eq("tasker_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("❌ [OFFERS] Error fetching user offers:", error);
      throw new Error(`Failed to fetch user offers: ${error.message}`);
    }

    console.log("✅ [OFFERS] Fetched user offers:", data?.length || 0, "for user:", userId);
    return data || [];
  } catch (error) {
    console.error("❌ [OFFERS] Exception in fetchUserOffers:", error);
    throw error;
  }
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
  
  // Validate session
  const sessionValidation = await validateSession();
  if (!sessionValidation.isValid) {
    console.error("❌ [OFFERS] Session validation failed for offer creation:", sessionValidation.error);
    throw new Error("Authentication required");
  }

  try {
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
  } catch (error) {
    console.error("❌ [OFFERS] Exception in createOffer:", error);
    throw error;
  }
};

export const acceptOffer = async (
  taskId: string,
  offerId: string
): Promise<{ success: boolean; error?: any }> => {
  try {
    console.log("🔄 [OFFERS] Accepting offer:", offerId, "for task:", taskId);
    
    // Validate session
    const sessionValidation = await validateSession();
    if (!sessionValidation.isValid) {
      console.error("❌ [OFFERS] Session validation failed for offer acceptance:", sessionValidation.error);
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

export const declineOffer = async (
  offerId: string
): Promise<{ success: boolean; error?: any }> => {
  console.log("🔄 [OFFERS] Declining offer:", offerId);
  
  // Validate session
  const sessionValidation = await validateSession();
  if (!sessionValidation.isValid) {
    console.error("❌ [OFFERS] Session validation failed for offer decline:", sessionValidation.error);
    return { success: false, error: "Authentication required" };
  }

  try {
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
  } catch (error) {
    console.error("❌ [OFFERS] Exception in declineOffer:", error);
    return { success: false, error: (error as Error).message };
  }
};
