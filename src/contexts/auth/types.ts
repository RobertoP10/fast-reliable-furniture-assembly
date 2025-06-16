
import { User, Session } from '@supabase/supabase-js';

export interface UserData {
  id: string;
  email: string;
  full_name: string;
  role: string;
  approved: boolean;
  created_at: string;
  updated_at: string;
  rating?: number;
  total_reviews?: number;
  phone_number?: string;
  location?: string;
  terms_accepted?: boolean;
  terms_accepted_at?: string;
}

export interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
  waitingForProfile: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string, fullName: string, phoneNumber: string, location: string, role: 'client' | 'tasker', termsAccepted: boolean) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

export interface AuthResponse {
  success: boolean;
  error?: string;
}
