
import { useState, useEffect } from 'react';
import { 
  fetchAllUsers, 
  fetchPendingTaskers, 
  fetchPendingTransactions, 
  fetchAllTransactions,
  fetchAnalyticsData 
} from '@/lib/adminApi';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
  task_requests?: { title: string; completed_at?: string };
  client?: { full_name: string };
  tasker?: { full_name: string };
}

interface Analytics {
  taskerBreakdown: any[];
  clientBreakdown: any[];
  confirmedTransactions: Transaction[];
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
  const { toast } = useToast();
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
    taskerBreakdown: [],
    clientBreakdown: [],
    confirmedTransactions: []
  });
  const [taskers, setTaskers] = useState<User[]>([]);
  const [clients, setClients] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastPendingCount, setLastPendingCount] = useState(0);

  const fetchAdminData = async () => {
    try {
      console.log('🔍 [ADMIN_DATA] Fetching admin data...');
      
      // Get current user to check admin status
      const { data: currentUser, error: userError } = await supabase
        .from('users')
        .select('role, approved')
        .eq('id', (await supabase.auth.getUser()).data.user?.id as any)
        .maybeSingle();

      if (userError && userError.code !== 'PGRST116') {
        console.error('❌ [ADMIN_DATA] Error checking user role:', userError);
        return;
      }

      if (!currentUser || (currentUser.role !== 'admin' && currentUser.approved !== true)) {
        console.error('❌ [ADMIN_DATA] Unauthorized access to admin data');
        return;
      }

      // Fetch all data using the new API functions
      const [
        usersData,
        pendingTaskersData,
        pendingTransactionsData,
        allTransactionsData,
        analyticsData
      ] = await Promise.all([
        fetchAllUsers(),
        fetchPendingTaskers(),
        fetchPendingTransactions(),
        fetchAllTransactions(),
        fetchAnalyticsData()
      ]);

      console.log('📊 [ADMIN_DATA] Fetched data:', {
        users: usersData.length,
        pendingTaskers: pendingTaskersData.length,
        pendingTransactions: pendingTransactionsData.length,
        allTransactions: allTransactionsData.length
      });

      // Check for new pending taskers and show notification
      if (pendingTaskersData.length > lastPendingCount && lastPendingCount > 0) {
        const newTaskersCount = pendingTaskersData.length - lastPendingCount;
        toast({
          title: "New Tasker Applications!",
          description: `${newTaskersCount} new tasker${newTaskersCount > 1 ? 's' : ''} waiting for approval.`,
        });
      }
      setLastPendingCount(pendingTaskersData.length);

      // Fetch basic stats
      const { count: tasksCount } = await supabase
        .from('task_requests')
        .select('*', { count: 'exact', head: true });

      const totalRevenue = allTransactionsData.reduce((sum, transaction) => sum + (Number(transaction.amount) || 0), 0);

      // Set stats
      setStats({
        totalUsers: usersData.length,
        totalTasks: tasksCount || 0,
        pendingTaskers: pendingTaskersData.length,
        totalRevenue
      });

      // Set data
      setPendingTaskers(pendingTaskersData);
      setAllUsers(usersData);
      setPendingTransactions(pendingTransactionsData);
      setTransactions(allTransactionsData);
      setAnalytics(analyticsData);
      
      // Set taskers and clients
      const taskersData = usersData.filter(u => u.role === 'tasker');
      const clientsData = usersData.filter(u => u.role === 'client');
      setTaskers(taskersData);
      setClients(clientsData);

      console.log('✅ [ADMIN_DATA] Admin data loaded successfully');

    } catch (error) {
      console.error('❌ [ADMIN_DATA] Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
    
    // Set up real-time subscription for new user registrations
    const userSubscription = supabase
      .channel('users-changes')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'users',
          filter: 'role=eq.tasker'
        }, 
        (payload) => {
          console.log('🔔 [ADMIN_DATA] New tasker registered:', payload.new);
          toast({
            title: "New Tasker Application!",
            description: `${(payload.new as any).full_name} has applied to become a tasker.`,
          });
          // Refresh data to show new pending tasker
          fetchAdminData();
        }
      )
      .subscribe();

    return () => {
      console.log('🧹 [ADMIN_DATA] Cleaning up subscriptions');
      userSubscription.unsubscribe();
    };
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
