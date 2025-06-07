import { supabase } from "@/integrations/supabase/client";
import type { Database } from '@/integrations/supabase/types';

type Offer = Database['public']['Tables']['offers']['Row'];

// ✅ Fetch offers for a specific task (vizibile pentru client)
export const fetchOffers = async (taskId: string): Promise<Offer[]> => {
  console.log('🔍 [OFFERS] Fetching offers for task:', taskId);

  const { data, error } = await supabase
    .from('offers')
    .select(`
      *,
      tasker:users!offers_tasker_id_fkey(full_name, approved)
    `)
    .eq('task_id', taskId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ [OFFERS] Error fetching offers:', error);
    throw new Error(`Failed to fetch offers: ${error.message}`);
  }

  console.log('✅ [OFFERS] Offers fetched successfully:', data?.length || 0, 'offers');
  return data || [];
};

// ✅ Fetch all offers made by a specific tasker (pentru tab-ul "My Offers")
export const fetchUserOffers = async (userId: string): Promise<Offer[]> => {
  console.log('🔍 [OFFERS] Fetching offers made by user:', userId);

  const { data, error } = await supabase
    .from('offers')
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
    .eq('tasker_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ [OFFERS] Error fetching user offers:', error);
    throw new Error(`Failed to fetch user offers: ${error.message}`);
  }

  console.log('✅ [OFFERS] Offers fetched for user:', data?.length || 0);
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
    .from('offers')
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

  console.log("✅ [OFFERS] Offer created with ID:", data.id);
  return data;
};

// ✅ Accept one offer and reject all others
export const acceptOffer = async (
  taskId: string,
  offerId: string
): Promise<{ success: boolean; error?: any }> => {
  console.log("📝 [OFFERS] Accepting offer ID:", offerId, "for task ID:", taskId);

  // 1. Reset all offers for task to not accepted
  const { error: resetError } = await supabase
    .from("offers")
    .update({ is_accepted: false })
    .eq("task_id", taskId);

  if (resetError) {
    console.error("❌ [OFFERS] Error resetting offers:", resetError);
    return { success: false, error: resetError };
  }

  // 2. Mark selected offer as accepted
  const { error: acceptError } = await supabase
    .from("offers")
    .update({ is_accepted: true })
    .eq("id", offerId);

  if (acceptError) {
    console.error("❌ [OFFERS] Error accepting offer:", acceptError);
    return { success: false, error: acceptError };
  }

  // 3. Update task status to 'accepted'
  const { error: taskError } = await supabase
    .from("task_requests")
    .update({ status: "accepted" })
    .eq("id", taskId);

  if (taskError) {
    console.error("❌ [OFFERS] Error updating task status:", taskError);
    return { success: false, error: taskError };
  }

  console.log("✅ [OFFERS] Offer accepted and task updated successfully.");
  return { success: true };
};
