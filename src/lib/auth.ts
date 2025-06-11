
import { supabase } from "@/integrations/supabase/client";

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
      accessToken: session.access_token ? 'present' : 'missing',
      tokenExpiry: session.expires_at ? new Date(session.expires_at * 1000).toISOString() : 'unknown'
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

export const fetchUserProfile = async (authUser: any) => {
  try {
    console.log('🔍 [AUTH] Fetching profile for user:', authUser.id);
    
    // Ensure we have a valid session before making RLS-protected queries
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      console.error('❌ [AUTH] No valid session for profile fetch:', sessionError);
      throw new Error('Authentication required for profile access');
    }

    // Use maybeSingle() to avoid errors when no data is found
    const { data, error } = await supabase
      .from('users')
      .select('id, email, full_name, role, approved, created_at, updated_at, rating, total_reviews')
      .eq('id', authUser.id)
      .maybeSingle();

    if (error) {
      console.error('❌ [AUTH] Error fetching user profile:', error);
      console.error('❌ [AUTH] Error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      
      // Handle specific RLS or policy errors
      if (error.code === '42P17' || error.message.includes('infinite recursion') || error.message.includes('policy')) {
        console.log('🔄 [AUTH] RLS policy error detected, this should be resolved with new policies');
        throw new Error('RLS policy error - please check database policies');
      }
      
      if (error.code === 'PGRST301' || error.message.includes('not found')) {
        console.warn('⚠️ [AUTH] User profile not found, creating default profile...');
        const { error: insertError } = await supabase
          .from('users')
          .insert({
            id: authUser.id,
            email: authUser.email || 'no-email@default.com',
            full_name: 'Default User',
            role: 'client',
            approved: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        if (insertError) {
          console.error('❌ [AUTH] Failed to create default profile:', insertError);
          return null;
        }
        return await fetchUserProfile(authUser); // Retry after creation
      }
      return null;
    }

    if (!data) {
      console.warn('⚠️ [AUTH] No profile data returned for user:', authUser.id);
      return null;
    }

    console.log('✅ [AUTH] Fetched user profile successfully:', {
      id: data.id,
      role: data.role,
      approved: data.approved,
      email: data.email
    });
    return data;
  } catch (error: any) {
    console.error('❌ [AUTH] Exception in fetchUserProfile:', error);
    
    // Re-throw RLS errors so they can be handled upstream
    if (error.message?.includes('RLS policy error') || error.message?.includes('infinite recursion')) {
      throw error;
    }
    
    return null;
  }
};

export const getCurrentUserRole = async (): Promise<string | null> => {
  try {
    // Ensure we have a valid session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      console.error('❌ [AUTH] No valid session for role check:', sessionError);
      return null;
    }

    const { data, error } = await supabase.rpc('get_current_user_role');
    
    if (error) {
      console.error('❌ [AUTH] Error getting user role:', error);
      return null;
    }
    
    console.log('✅ [AUTH] Current user role:', data);
    return data;
  } catch (error) {
    console.error('❌ [AUTH] Exception getting user role:', error);
    return null;
  }
};
