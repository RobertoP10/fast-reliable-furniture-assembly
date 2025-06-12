
import { supabase } from "@/integrations/supabase/client";

// Temporarily disable pending clients functionality
export const fetchPendingClients = async () => {
  console.log('🔍 [ADMIN] Pending clients functionality disabled - returning empty array');
  return [];
};

export const approveClientTask = async (taskId: string) => {
  console.log('🔍 [ADMIN] Pending clients functionality disabled');
  return null;
};

export const rejectClientTask = async (taskId: string, rejectionReason?: string) => {
  console.log('🔍 [ADMIN] Pending clients functionality disabled');
  return null;
};
