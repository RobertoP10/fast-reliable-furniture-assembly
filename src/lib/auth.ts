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

export const fetchUserProfile = async (authUser: any) => {
  try {
    console.log('🔍 [AUTH] Fetching profile for user:', authUser.id);
    const { data, error } = await supabase
      .from('users')
      .select('id, email, full_name, role, approved, created_at, updated_at')
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
        return await fetchUserProfile(authUser); // Reîncercare după creare
      }
      return null;
    }

    if (!data) {
      console.warn('⚠️ [AUTH] No profile data returned for user:', authUser.id);
      return null;
    }

    console.log('✅ [AUTH] Fetched user profile:', data);
    return data;
  } catch (error) {
    console.error('❌ [AUTH] Exception in fetchUserProfile:', error);
    return null;
  }
};

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