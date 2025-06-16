
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AdminStats {
  totalUsers: number;
  totalTasks: number;
  pendingTaskers: number;
  totalRevenue: number;
}

interface PendingTasker {
  id: string;
  full_name: string;
  email: string;
  created_at: string;
}

interface Transaction {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  task_requests?: { title: string };
  client?: { full_name: string };
  tasker?: { full_name: string };
}

interface Analytics {
  totalEarnings: number;
  totalTasks: number;
  averageRating: number;
}

interface User {
  id: string;
  full_name: string;
  email: string;
  role: string;
  approved: boolean;
  created_at: string;
}

export const useAdminData = () => {
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalTasks: 0,
    pendingTaskers: 0,
    totalRevenue: 0
  });
  const [pendingTaskers, setPendingTaskers] = useState<PendingTasker[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [pendingTransactions, setPendingTransactions] = useState<Transaction[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [analytics, setAnalytics] = useState<Analytics>({
    totalEarnings: 0,
    totalTasks: 0,
    averageRating: 0
  });
  const [taskers, setTaskers] = useState<User[]>([]);
  const [clients, setClients] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAdminData = async () => {
    try {
      // Get current user to check admin status
      const { data: currentUser, error: userError } = await supabase
        .from('users')
        .select('role, approved')
        .eq('id', (await supabase.auth.getUser()).data.user?.id as any)
        .maybeSingle();

      if (userError && userError.code !== 'PGRST116') {
        console.error('Error checking user role:', userError);
        return;
      }

      if (!currentUser || (currentUser.role !== 'admin' && currentUser.approved !== true)) {
        console.error('Unauthorized access to admin data');
        return;
      }

      // Fetch all users count
      const { count: usersCount } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      // Fetch all tasks count
      const { count: tasksCount } = await supabase
        .from('task_requests')
        .select('*', { count: 'exact', head: true });

      // Fetch pending taskers count and data
      const { data: pendingTaskersData, count: pendingCount } = await supabase
        .from('users')
        .select('id, full_name, email, created_at')
        .eq('role', 'tasker' as any)
        .eq('approved', false as any);

      // Fetch all users
      const { data: allUsersData } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      // Fetch transactions
      const { data: transactionsData } = await supabase
        .from('transactions')
        .select(`
          *,
          task_requests(title),
          client:users!transactions_client_id_fkey(full_name),
          tasker:users!transactions_tasker_id_fkey(full_name)
        `)
        .order('created_at', { ascending: false });

      // Fetch total revenue (sum of all transaction amounts)
      const { data: revenueData } = await supabase
        .from('transactions')
        .select('amount');

      const totalRevenue = revenueData?.reduce((sum, transaction) => sum + (transaction.amount || 0), 0) || 0;

      // Set stats
      setStats({
        totalUsers: usersCount || 0,
        totalTasks: tasksCount || 0,
        pendingTaskers: pendingCount || 0,
        totalRevenue
      });

      // Set data
      setPendingTaskers(pendingTaskersData || []);
      setAllUsers(allUsersData || []);
      setTransactions(transactionsData || []);
      setPendingTransactions((transactionsData || []).filter(t => t.status === 'pending'));
      
      // Set taskers and clients
      const taskersData = (allUsersData || []).filter(u => u.role === 'tasker');
      const clientsData = (allUsersData || []).filter(u => u.role === 'client');
      setTaskers(taskersData);
      setClients(clientsData);

      // Set analytics
      setAnalytics({
        totalEarnings: totalRevenue,
        totalTasks: tasksCount || 0,
        averageRating: 0 // Calculate this based on reviews if needed
      });

    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  return {
    stats,
    pendingTaskers,
    setPendingTaskers,
    allUsers,
    pendingTransactions,
    setPendingTransactions,
    transactions,
    analytics,
    setStats,
    loading,
    taskers,
    clients,
    loadData: fetchAdminData,
    refetch: fetchAdminData
  };
};
