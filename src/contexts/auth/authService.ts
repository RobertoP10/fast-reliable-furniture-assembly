
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
      emailRedirectTo: `${window.location.origin}/`
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
  
  // Step 2: Check if we have a session immediately
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError) {
    console.error('Session error:', sessionError);
    throw new Error('Failed to establish session after registration');
  }

  if (!session) {
    console.log('No immediate session - user needs to confirm email');
    throw new Error('Please check your email and click the confirmation link to complete registration');
  }

  console.log('Session established successfully for user ID:', session.user.id);
  
  // Step 3: Create profile in users table using the authenticated user's ID
  const userProfile = {
    id: session.user.id,
    name: userData.name.trim(),
    email: userData.email.trim(),
    phone: userData.phone?.trim() || null,
    location: userData.location?.trim() || '',
    role: userData.role,
    approved: userData.role === 'client' ? 'true' : 'false',
    created_at: new Date().toISOString()
  };
  
  console.log('Inserting user profile with authenticated ID:', userProfile.id);
  
  const { data: insertedProfile, error: profileError } = await supabase
    .from('users')
    .insert(userProfile)
    .select()
    .single();
  
  if (profileError) {
    console.error('Profile creation error:', profileError);
    throw new Error(`Failed to create user profile: ${profileError.message}`);
  }
  
  console.log('User profile created successfully:', insertedProfile);
  console.log('Registration completed successfully for user ID:', session.user.id);
};

export const logoutUser = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};
