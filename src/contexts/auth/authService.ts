
import { supabase } from '@/integrations/supabase/client';
import type { User } from './types';

export const loginUser = async (email: string, password: string) => {
  console.log('Starting login process for:', email);
  
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) {
    console.error('Login error:', error);
    throw error;
  }
  
  // Wait for valid session after login
  const session = await waitForSession(10, 1000);
  console.log('Login session established for user ID:', session.user.id);
  
  return session;
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
  console.log('Starting registration process for:', userData.email);
  
  try {
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
    
    // Step 2: Wait for valid session with polling (10 second timeout)
    console.log('Waiting for valid session...');
    let session;
    try {
      session = await waitForSession(10, 1000);
    } catch (error) {
      console.error('Session establishment failed:', error);
      // Clean up auth user if session fails
      await supabase.auth.signOut();
      throw new Error('Failed to establish authenticated session. Please try logging in manually.');
    }

    console.log('Session established successfully for user ID:', session.user.id);
    
    // Step 3: Create profile in users table
    const userProfile = {
      id: session.user.id,
      email: userData.email.trim(),
      name: userData.name.trim(),
      phone: userData.phone?.trim() || null,
      location: userData.location?.trim() || '',
      role: userData.role,
      created_at: new Date().toISOString()
    };
    
    console.log('Inserting user profile:', userProfile);
    
    const { data: insertedProfile, error: profileError } = await supabase
      .from('users')
      .insert(userProfile)
      .select()
      .single();
    
    if (profileError) {
      console.error('Profile creation error:', profileError);
      
      // Clean up auth user if profile creation fails
      await supabase.auth.signOut();
      
      const errorMessage = `Failed to create user profile: ${profileError.message}${profileError.details ? `. Details: ${profileError.details}` : ''}`;
      throw new Error(errorMessage);
    }
    
    console.log('User profile created successfully:', insertedProfile);
    console.log('Registration completed successfully for user ID:', session.user.id);
    
    return { session, profile: insertedProfile };
    
  } catch (error: any) {
    console.error('Registration failed:', error);
    throw error;
  }
};

export const logoutUser = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

export const fetchUserProfile = async (userId: string): Promise<User | null> => {
  console.log('Fetching user profile for ID:', userId);
  
  const { data: userProfile, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  
  if (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
  
  if (!userProfile) {
    console.log('No user profile found for ID:', userId);
    return null;
  }
  
  console.log('User profile fetched successfully:', userProfile);
  return {
    id: userProfile.id,
    email: userProfile.email || '',
    name: userProfile.name || '',
    role: userProfile.role as 'client' | 'tasker' | 'admin',
    location: userProfile.location || '',
    phone: userProfile.phone || '',
    isApproved: userProfile.approved === 'true',
    rating: 0,
    completedTasks: 0
  };
};
