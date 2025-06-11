
import { supabase } from "@/integrations/supabase/client";

export interface SessionValidation {
  isValid: boolean;
  userId: string | null;
  error?: string;
}

export const validateSession = async (): Promise<SessionValidation> => {
  try {
    console.log('🔍 [SESSION] Validating current session...');
    
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('❌ [SESSION] Session validation error:', error);
      return { isValid: false, userId: null, error: error.message };
    }

    if (!session?.user?.id) {
      console.warn('⚠️ [SESSION] No valid session found');
      return { isValid: false, userId: null, error: 'No active session' };
    }

    // Verify token is not expired
    const now = Math.floor(Date.now() / 1000);
    if (session.expires_at && session.expires_at < now) {
      console.warn('⚠️ [SESSION] Token expired, attempting refresh...');
      
      const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError || !refreshed.session) {
        return { isValid: false, userId: null, error: 'Session expired and refresh failed' };
      }
      
      console.log('✅ [SESSION] Token refreshed successfully');
      return { isValid: true, userId: refreshed.session.user.id };
    }

    console.log('✅ [SESSION] Session valid:', {
      userId: session.user.id,
      email: session.user.email,
      expiresAt: session.expires_at ? new Date(session.expires_at * 1000).toISOString() : 'unknown'
    });

    return { isValid: true, userId: session.user.id };
  } catch (error) {
    console.error('❌ [SESSION] Unexpected error:', error);
    return { isValid: false, userId: null, error: 'Unexpected session validation error' };
  }
};
