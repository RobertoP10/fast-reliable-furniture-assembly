
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

export const useAdminData = () => {
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalTasks: 0,
    pendingTaskers: 0,
    totalRevenue: 0
  });
  const [pendingTaskers, setPendingTaskers] = useState<PendingTasker[]>([]);
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

      // Fetch total revenue (sum of all transaction amounts)
      const { data: revenueData } = await supabase
        .from('transactions')
        .select('amount');

      const totalRevenue = revenueData?.reduce((sum, transaction) => sum + (transaction.amount || 0), 0) || 0;

      setStats({
        totalUsers: usersCount || 0,
        totalTasks: tasksCount || 0,
        pendingTaskers: pendingCount || 0,
        totalRevenue
      });

      setPendingTaskers(pendingTaskersData || []);
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
    loading,
    refetch: fetchAdminData
  };
};
