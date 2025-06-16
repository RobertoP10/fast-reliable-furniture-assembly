
import { supabase } from "@/integrations/supabase/client";

export interface SessionValidation {
  isValid: boolean;
  userId: string | null;
  error?: string;
}

export const validateSession = async (): Promise<SessionValidation> => {
  try {
    console.log('🔍 [SESSION] Validating current session...');
    
    // Increased timeout for better user experience - 15 seconds should handle slower networks
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Session validation timeout')), 15000);
    });

    const sessionPromise = supabase.auth.getSession();
    
    const { data: { session }, error } = await Promise.race([
      sessionPromise,
      timeoutPromise
    ]);
    
    if (error) {
      console.error('❌ [SESSION] Session validation error:', error);
      return { isValid: false, userId: null, error: error.message };
    }

    if (!session?.user?.id) {
      console.warn('⚠️ [SESSION] No valid session found');
      return { isValid: false, userId: null, error: 'No active session' };
    }

    // Extended token buffer to 10 minutes (600 seconds) for better persistence
    const now = Math.floor(Date.now() / 1000);
    const tokenBuffer = 600; // 10 minutes buffer
    
    if (session.expires_at && (session.expires_at - tokenBuffer) < now) {
      console.warn('⚠️ [SESSION] Token expiring soon, attempting refresh...');
      
      try {
        // Increased timeout for token refresh to handle network delays
        const refreshTimeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Token refresh timeout')), 10000);
        });

        const refreshPromise = supabase.auth.refreshSession();
        
        const { data: refreshed, error: refreshError } = await Promise.race([
          refreshPromise,
          refreshTimeoutPromise
        ]);
        
        if (refreshError || !refreshed.session) {
          console.error('❌ [SESSION] Token refresh failed:', refreshError);
          return { isValid: false, userId: null, error: 'Session expired and refresh failed' };
        }
        
        console.log('✅ [SESSION] Token refreshed successfully');
        return { isValid: true, userId: refreshed.session.user.id };
      } catch (refreshErr) {
        console.error('❌ [SESSION] Error refreshing token:', refreshErr);
        return { isValid: false, userId: null, error: 'Token refresh failed' };
      }
    }

    console.log('✅ [SESSION] Session valid:', {
      userId: session.user.id,
      email: session.user.email,
      expiresAt: session.expires_at ? new Date(session.expires_at * 1000).toISOString() : 'unknown',
      timeToExpiry: session.expires_at ? `${Math.floor((session.expires_at - now) / 60)} minutes` : 'unknown'
    });

    return { isValid: true, userId: session.user.id };
  } catch (error: any) {
    console.error('❌ [SESSION] Unexpected error:', error);
    
    // More graceful handling of timeout and network errors - don't immediately invalidate session
    if (error.message?.includes('timeout')) {
      console.warn('⚠️ [SESSION] Session validation timed out, but keeping existing session if available');
      // Try to get session without validation as fallback
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.id) {
          console.log('✅ [SESSION] Fallback session found, continuing with existing session');
          return { isValid: true, userId: session.user.id };
        }
      } catch (fallbackError) {
        console.error('❌ [SESSION] Fallback session check failed:', fallbackError);
      }
      return { isValid: false, userId: null, error: 'Session validation timeout - please try logging in again' };
    }
    
    if (error.message?.includes('fetch') || error.message?.includes('NetworkError') || error.message?.includes('CORS')) {
      console.warn('⚠️ [SESSION] Network error during validation, trying fallback session check');
      // Try to get session without validation as fallback
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.id) {
          console.log('✅ [SESSION] Fallback session found during network issue');
          return { isValid: true, userId: session.user.id };
        }
      } catch (fallbackError) {
        console.error('❌ [SESSION] Fallback session check failed:', fallbackError);
      }
      return { isValid: false, userId: null, error: 'Network error - please check your connection' };
    }
    
    return { isValid: false, userId: null, error: 'Session validation failed' };
  }
};
