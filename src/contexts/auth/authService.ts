
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

// Helper function to wait for session with retries
const waitForSession = async (maxRetries = 10): Promise<any> => {
  for (let i = 0; i < maxRetries; i++) {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Session check error:', error);
      throw new Error('Failed to verify session');
    }
    
    if (session) {
      console.log('Session established successfully:', session.user.id);
      return session;
    }
    
    console.log(`Waiting for session... attempt ${i + 1}/${maxRetries}`);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second between retries
  }
  
  throw new Error('Session not established after maximum retries');
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
  
  // Step 2: Wait for session to be established with retries
  let session;
  try {
    session = await waitForSession(10);
  } catch (error) {
    console.error('Session establishment failed:', error);
    throw new Error('Please check your email and click the confirmation link to complete registration');
  }
  
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
  
  return session;
};

export const logoutUser = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};
