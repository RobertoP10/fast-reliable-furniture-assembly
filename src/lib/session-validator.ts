
import { supabase } from "@/integrations/supabase/client";

export interface SessionValidation {
  isValid: boolean;
  userId: string | null;
  error?: string;
}

export const validateSession = async (): Promise<SessionValidation> => {
  try {
    console.log('🔍 [SESSION] Validating current session...');
    
    // First try to get the session directly (faster, no network call)
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('❌ [SESSION] Session validation error:', error);
        return { isValid: false, userId: null, error: error.message };
      }

      if (!session?.user?.id) {
        console.warn('⚠️ [SESSION] No valid session found');
        return { isValid: false, userId: null, error: 'No active session' };
      }

      // Check if token is still valid with a shorter buffer
      const now = Math.floor(Date.now() / 1000);
      const tokenBuffer = 60; // 1 minute buffer instead of 5
      
      if (session.expires_at && (session.expires_at - tokenBuffer) < now) {
        console.warn('⚠️ [SESSION] Token expiring soon, attempting refresh...');
        
        try {
          // Much shorter refresh timeout - 3 seconds
          const refreshTimeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error('Token refresh timeout')), 3000);
          });

          const refreshPromise = supabase.auth.refreshSession();
          
          const { data: refreshed, error: refreshError } = await Promise.race([
            refreshPromise,
            refreshTimeoutPromise
          ]);
          
          if (refreshError || !refreshed.session) {
            console.warn('⚠️ [SESSION] Token refresh failed, but keeping existing session');
            // Don't fail completely, use existing session if user ID exists
            return { isValid: true, userId: session.user.id };
          }
          
          console.log('✅ [SESSION] Token refreshed successfully');
          return { isValid: true, userId: refreshed.session.user.id };
        } catch (refreshErr) {
          console.warn('⚠️ [SESSION] Token refresh failed, using existing session');
          // Don't fail completely, use existing session if user ID exists
          return { isValid: true, userId: session.user.id };
        }
      }

      console.log('✅ [SESSION] Session valid:', {
        userId: session.user.id,
        email: session.user.email,
        expiresAt: session.expires_at ? new Date(session.expires_at * 1000).toISOString() : 'unknown',
        timeToExpiry: session.expires_at ? `${Math.floor((session.expires_at - now) / 60)} minutes` : 'unknown'
      });

      return { isValid: true, userId: session.user.id };
    } catch (sessionError: any) {
      console.error('❌ [SESSION] Error getting session:', sessionError);
      return { isValid: false, userId: null, error: 'Failed to get session' };
    }
  } catch (error: any) {
    console.error('❌ [SESSION] Unexpected error:', error);
    
    // Always try to get local session as fallback
    try {
      console.log('🔄 [SESSION] Trying local session fallback...');
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        console.log('✅ [SESSION] Local session found, using it');
        return { isValid: true, userId: session.user.id };
      }
    } catch (fallbackError) {
      console.error('❌ [SESSION] Fallback session check failed:', fallbackError);
    }
    
    return { isValid: false, userId: null, error: 'Session validation failed' };
  }
};
