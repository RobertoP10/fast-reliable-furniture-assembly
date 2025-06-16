
import { supabase } from "@/integrations/supabase/client";

export interface SessionValidation {
  isValid: boolean;
  userId: string | null;
  error?: string;
}

export const validateSession = async (): Promise<SessionValidation> => {
  try {
    console.log('🔍 [SESSION] Validating current session...');
    
    // Reduced timeout to prevent hanging - 8 seconds should be sufficient
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Session validation timeout')), 8000);
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

    // Check if token is expired with a smaller buffer
    const now = Math.floor(Date.now() / 1000);
    const tokenBuffer = 180; // Reduced to 3 minutes buffer
    
    if (session.expires_at && (session.expires_at - tokenBuffer) < now) {
      console.warn('⚠️ [SESSION] Token expiring soon, attempting refresh...');
      
      try {
        // Use a shorter timeout for token refresh
        const refreshTimeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Token refresh timeout')), 5000);
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
    
    // Handle specific timeout and network errors more gracefully
    if (error.message?.includes('timeout')) {
      console.warn('⚠️ [SESSION] Session validation timed out, treating as no session');
      return { isValid: false, userId: null, error: 'Session validation timeout - please try logging in again' };
    }
    
    if (error.message?.includes('fetch') || error.message?.includes('NetworkError') || error.message?.includes('CORS')) {
      console.warn('⚠️ [SESSION] Network error during validation, treating as no session');
      return { isValid: false, userId: null, error: 'Network error - please check your connection' };
    }
    
    return { isValid: false, userId: null, error: 'Session validation failed' };
  }
};
