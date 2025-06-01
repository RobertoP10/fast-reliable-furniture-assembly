
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
  
  // Step 1: Create the auth user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: userData.email,
    password: userData.password,
    options: {
      emailRedirectTo: `${window.location.origin}/`,
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

  // Step 2: Create user profile in users table
  try {
    const { error: profileError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        phone: userData.phone || '',
        location: userData.location || '',
        approved: userData.role === 'client' ? 'true' : 'false', // Auto-approve clients, taskers need manual approval
        created_at: new Date().toISOString()
      });

    if (profileError) {
      console.error('Profile creation error:', profileError);
      // Don't throw here as auth user is already created
      // The trigger should handle this, but we're being explicit
    } else {
      console.log('User profile created successfully');
    }
  } catch (error) {
    console.error('Error creating user profile:', error);
    // Continue - the user can still be authenticated even if profile creation fails initially
  }
  
  return authData;
};

export const logoutUser = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};
