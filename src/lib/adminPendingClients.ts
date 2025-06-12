
import { supabase } from "@/integrations/supabase/client";

// Re-export the functions from the users module for backward compatibility
export { fetchPendingClients, approveClientTask, rejectClientTask } from './admin/users';
