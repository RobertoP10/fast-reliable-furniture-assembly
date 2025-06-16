
export interface PendingTasker {
  id: string;
  full_name: string;
  email: string;
  created_at: string;
  role: string;
  approved: boolean;
}

export interface Transaction {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  task_id: string;
  client_id: string;
  tasker_id: string;
  payment_method: string;
  admin_confirmed_at?: string;
  admin_confirmed_by?: string;
  task_requests?: {
    title: string;
    completed_at?: string;
  };
  client?: {
    id: string;
    full_name: string;
    email: string;
  };
  tasker?: {
    id: string;
    full_name: string;
    email: string;
  };
}

export interface User {
  id: string;
  full_name: string;
  email: string;
  role: string;
  approved: boolean;
  created_at: string;
  rating?: number;
  total_reviews?: number;
}

export interface TaskerBreakdown {
  id: string;
  name: string;
  taskCount: number;
  totalEarnings: number;
  totalCommission: number;
  lastTaskDate: string | null;
  averageRating: number;
}

export interface ClientBreakdown {
  id: string;
  name: string;
  taskCount: number;
  totalSpent: number;
  totalCommission: number;
  lastTaskDate: string | null;
  averageRating: number;
}

export interface AnalyticsData {
  taskerBreakdown: TaskerBreakdown[];
  clientBreakdown: ClientBreakdown[];
  confirmedTransactions: Transaction[];
}
