
// Frontend types that match our database schema
export type UserRole = 'client' | 'tasker' | 'admin';
export type TaskStatus = 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
export type OfferStatus = 'pending' | 'accepted' | 'rejected' | 'withdrawn';
export type PaymentMethod = 'cash' | 'card' | 'bank_transfer';
export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'refunded';

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  location?: string;
  role: UserRole;
  approved: boolean;
  profile_photo?: string;
  created_at: string;
  updated_at: string;
}

export interface TaskRequest {
  id: string;
  client_id: string;
  title: string;
  description: string;
  category: string;
  subcategory?: string;
  price_range_min?: number;
  price_range_max?: number;
  location: string;
  status: TaskStatus;
  payment_method: PaymentMethod;
  image_url?: string;
  accepted_offer_id?: string;
  created_at: string;
  updated_at: string;
  // Relations
  client?: User;
  offers?: Offer[];
  accepted_offer?: Offer;
}

export interface Offer {
  id: string;
  task_id: string;
  tasker_id: string;
  price: number;
  message?: string;
  status: OfferStatus;
  created_at: string;
  updated_at: string;
  // Relations
  task?: TaskRequest;
  tasker?: User;
}

export interface Message {
  id: string;
  task_id: string;
  sender_id: string;
  receiver_id: string;
  message?: string;
  image_url?: string;
  created_at: string;
  // Relations
  sender?: User;
  receiver?: User;
  task?: TaskRequest;
}

export interface Review {
  id: string;
  task_id: string;
  reviewer_id: string;
  reviewed_id: string;
  rating: number;
  comment?: string;
  created_at: string;
  // Relations
  reviewer?: User;
  reviewed?: User;
  task?: TaskRequest;
}

export interface Transaction {
  id: string;
  task_id: string;
  payer_id: string;
  payee_id: string;
  amount: number;
  payment_method: PaymentMethod;
  status: TransactionStatus;
  stripe_payment_intent_id?: string;
  created_at: string;
  updated_at: string;
  // Relations
  payer?: User;
  payee?: User;
  task?: TaskRequest;
}
