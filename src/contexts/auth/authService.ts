
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
  
  // Step 2: Immediately log in to establish session
  console.log('Logging in to establish session...');
  const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
    email: userData.email,
    password: userData.password,
  });
  
  if (loginError) {
    console.error('Auto-login error:', loginError);
    throw new Error(`Failed to establish session: ${loginError.message}`);
  }

  if (!loginData.session || !loginData.user) {
    throw new Error('Failed to establish authenticated session after signup');
  }

  console.log('Session established successfully for user ID:', loginData.user.id);
  
  // Step 3: Get the current session to ensure we have the latest session data
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError) {
    console.error('Failed to get session:', sessionError);
    throw new Error(`Failed to retrieve session: ${sessionError.message}`);
  }

  if (!session || !session.user) {
    throw new Error('No valid session found after login');
  }

  console.log('Using session user ID for profile creation:', session.user.id);
  
  // Step 4: Create profile in users table using the authenticated user's ID
  const userProfile = {
    id: session.user.id, // This ensures we use auth.uid() for RLS compliance
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
    console.error('Full error details:', {
      message: profileError.message,
      details: profileError.details,
      hint: profileError.hint,
      code: profileError.code
    });
    
    // Clean up auth user if profile creation fails
    try {
      await supabase.auth.signOut();
    } catch (cleanupError) {
      console.error('Failed to cleanup auth user:', cleanupError);
    }
    
    throw new Error(`Failed to create user profile: ${profileError.message}${profileError.details ? `. Details: ${profileError.details}` : ''}${profileError.hint ? `. Hint: ${profileError.hint}` : ''}`);
  }
  
  console.log('User profile created successfully:', insertedProfile);
  console.log('Registration completed successfully for user ID:', session.user.id);
};

export const logoutUser = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};
