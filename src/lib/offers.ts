import { supabase } from "@/integrations/supabase/client";
import type { Database } from '@/integrations/supabase/types';

type Offer = Database['public']['Tables']['offers']['Row'];

// Fetch offers for a specific task
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

// Fetch user's offers
export const fetchUserOffers = async (userId: string): Promise<Offer[]> => {
  console.log('🔍 [OFFERS] Fetching offers for user:', userId);

  const { data, error } = await supabase
    .from('offers')
    .select(`
      *,
      task:task_requests!offers_task_id_fkey(title, description, location, status)
    `)
    .eq('tasker_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ [OFFERS] Error fetching user offers:', error);
    throw new Error(`Failed to fetch user offers: ${error.message}`);
  }

  console.log('✅ [OFFERS] User offers fetched successfully:', data?.length || 0, 'offers');
  return data;
};

// Create an offer (updated with available date/time)
export const createOffer = async (offerData: {
  task_id: string;
  tasker_id: string;
  price: number;
  message?: string;
  proposed_date: string;  // <- actualizat
  proposed_time: string;  // <- actualizat
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

  console.log("✅ [OFFERS] Offer created successfully with ID:", data.id);
  return data;
};

// Accept an offer
export const acceptOffer = async (offerId: string): Promise<void> => {
  console.log('📝 [OFFERS] Accepting offer:', offerId);

  const { error } = await supabase
    .from('offers')
    .update({ is_accepted: true })
    .eq('id', offerId);

  if (error) {
    console.error('❌ [OFFERS] Error accepting offer:', error);
    throw new Error(`Failed to accept offer: ${error.message}`);
  }

  console.log('✅ [OFFERS] Offer accepted successfully');
};
