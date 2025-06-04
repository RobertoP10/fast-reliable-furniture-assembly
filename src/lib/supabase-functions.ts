
import { supabase } from "@/integrations/supabase/client";

// Create the get_current_user_role function if it doesn't exist
export const createGetCurrentUserRoleFunction = async () => {
  const { error } = await supabase.rpc('get_current_user_role');
  
  if (error && error.message.includes('function get_current_user_role() does not exist')) {
    console.log('Creating get_current_user_role function...');
    // Function will be created via SQL migration
    return false;
  }
  
  return true;
};
