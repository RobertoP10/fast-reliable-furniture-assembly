
import { supabase } from '@/integrations/supabase/client';
import type { User } from './types';

export const loginUser = async (email: string, password: string) => {
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) {
    console.error('Login error:', error);
    throw error;
  }
};

export const registerUser = async (userData: Omit<User, 'id'> & { password: string }) => {
  console.log('Starting registration process...');
  
  // Step 1: Create the auth user with metadata
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: userData.email,
    password: userData.password,
    options: {
      emailRedirectTo: `${window.location.origin}/`,
      data: {
        name: userData.name,
        role: userData.role,
        phone: userData.phone || '',
        location: userData.location || ''
      }
    }
  });
  
  if (authError) {
    console.error('Auth registration error:', authError);
    throw new Error(`Authentication failed: ${authError.message}`);
  }

  if (!authData.user) {
    throw new Error('Failed to create user account - no user returned');
  }

  console.log('Auth user created successfully with ID:', authData.user.id);
  
  // The trigger will automatically create the user profile
  // Return the auth data for the calling function
  return authData;
};

export const logoutUser = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};
