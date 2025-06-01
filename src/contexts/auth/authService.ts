
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

const waitForSession = async (maxRetries = 10, delayMs = 1000): Promise<any> => {
  for (let i = 0; i < maxRetries; i++) {
    console.log(`Checking for session, attempt ${i + 1}/${maxRetries}...`);
    
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Session check error:', error);
      throw new Error(`Failed to check session: ${error.message}`);
    }
    
    if (session && session.user) {
      console.log('Valid session found:', session.user.id);
      return session;
    }
    
    if (i < maxRetries - 1) {
      console.log(`No session yet, waiting ${delayMs}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  
  throw new Error('Session not established within timeout period');
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
  
  // Step 2: Wait for valid session with polling
  console.log('Waiting for valid session...');
  let session;
  try {
    session = await waitForSession(10, 1000); // 10 attempts, 1 second apart
  } catch (error) {
    console.error('Session establishment failed:', error);
    throw new Error('Failed to establish authenticated session. Please try logging in manually.');
  }

  console.log('Session established successfully for user ID:', session.user.id);
  
  // Step 3: Create profile in users table using the authenticated user's ID
  const userProfile = {
    id: session.user.id, // Use session.user.id to ensure RLS compliance
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
    
    // Show alert to user
    alert(`Failed to create user profile: ${profileError.message}${profileError.details ? `. Details: ${profileError.details}` : ''}${profileError.hint ? `. Hint: ${profileError.hint}` : ''}`);
    
    throw new Error(`Failed to create user profile: ${profileError.message}${profileError.details ? `. Details: ${profileError.details}` : ''}${profileError.hint ? `. Hint: ${profileError.hint}` : ''}`);
  }
  
  console.log('User profile created successfully:', insertedProfile);
  console.log('Registration completed successfully for user ID:', session.user.id);
};

export const logoutUser = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};
