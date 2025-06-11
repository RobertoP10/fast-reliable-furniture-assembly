
import { supabase } from "@/integrations/supabase/client";
import { validateSession } from "./session-validator";

export const validateUserSession = async (): Promise<{ session: any; profile: any } | null> => {
  try {
    console.log('🔍 [AUTH] Starting session validation...');
    
    const sessionValidation = await validateSession();
    
    if (!sessionValidation.isValid || !sessionValidation.userId) {
      console.log('ℹ️ [AUTH] No active session found');
      return null;
    }

    // Get the actual session object for compatibility
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      console.error('❌ [AUTH] Failed to get session object:', sessionError);
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
    
    // Validate session before making RLS-protected queries
    const sessionValidation = await validateSession();
    
    if (!sessionValidation.isValid || !sessionValidation.userId) {
      console.error('❌ [AUTH] No valid session for profile fetch:', sessionValidation.error);
      throw new Error('Authentication required for profile access');
    }

    // Verify the session user matches the requested user
    if (sessionValidation.userId !== authUser.id) {
      console.error('❌ [AUTH] User ID mismatch. Session:', sessionValidation.userId, 'Requested:', authUser.id);
      throw new Error('User ID mismatch');
    }

    // Use maybeSingle() to avoid errors when no data is found
    const { data, error } = await supabase
      .from('users')
      .select('id, email, full_name, role, approved, created_at, updated_at, rating, total_reviews')
      .eq('id', authUser.id)
      .maybeSingle();

    if (error) {
      console.error('❌ [AUTH] Error fetching user profile:', error);
      
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
    return null;
  }
};

export const getCurrentUserRole = async (): Promise<string | null> => {
  try {
    // Validate session before making RPC call
    const sessionValidation = await validateSession();
    
    if (!sessionValidation.isValid) {
      console.error('❌ [AUTH] No valid session for role check:', sessionValidation.error);
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
