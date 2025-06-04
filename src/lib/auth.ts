
import { supabase } from "@/integrations/supabase/client";

// Enhanced session validation with detailed logging
export const validateUserSession = async (): Promise<{ session: any; profile: any } | null> => {
  try {
    console.log('🔍 [AUTH] Starting session validation...');
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ [AUTH] Session validation error:', sessionError);
      return null;
    }

    if (!session?.user) {
      console.log('ℹ️ [AUTH] No active session found');
      return null;
    }

    console.log('✅ [AUTH] Session validation successful:', {
      userId: session.user.id,
      email: session.user.email,
      accessToken: session.access_token ? 'present' : 'missing'
    });

    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (profileError) {
      console.error('❌ [AUTH] Profile fetch error:', profileError);
      return { session, profile: null };
    }

    console.log('✅ [AUTH] Profile validation successful:', {
      userId: profile?.id,
      role: profile?.role,
      approved: profile?.approved,
      email: profile?.email
    });
    
    return { session, profile };
    
  } catch (error) {
    console.error('❌ [AUTH] Exception in validateUserSession:', error);
    return null;
  }
};

// Get current user role
export const getCurrentUserRole = async (): Promise<string | null> => {
  try {
    const { data, error } = await supabase.rpc('get_current_user_role');
    
    if (error) {
      console.error('❌ [AUTH] Error getting user role:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('❌ [AUTH] Exception getting user role:', error);
    return null;
  }
};
