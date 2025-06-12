
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { 
  fetchPendingTaskers, 
  fetchPendingClients,
  fetchAllUsers, 
  fetchPendingTransactions, 
  fetchAllTransactions,
  fetchTransactionsByDateRange,
  fetchTransactionsByTasker,
  fetchTransactionsByClient,
  getPlatformAnalytics,
  getAdminStats
} from "@/lib/admin";

export const useAdminData = (
  activeTab: string,
  dateFilter: { start: string; end: string },
  selectedTasker: string,
  selectedClient: string
) => {
  const { toast } = useToast();
  const [pendingTaskers, setPendingTaskers] = useState<any[]>([]);
  const [pendingClients, setPendingClients] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [pendingTransactions, setPendingTransactions] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [taskers, setTaskers] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);

  const loadFilterOptions = async () => {
    try {
      const users = await fetchAllUsers();
      const taskerUsers = users.filter(u => u.role === 'tasker' && u.approved);
      const clientUsers = users.filter(u => u.role === 'client');
      setTaskers(taskerUsers);
      setClients(clientUsers);
    } catch (error) {
      console.error('Error loading filter options:', error);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      console.log('🔄 [ADMIN] Loading data for tab:', activeTab);
      
      if (activeTab === 'pending-taskers') {
        const taskers = await fetchPendingTaskers();
        setPendingTaskers(taskers);
        console.log('✅ [ADMIN] Loaded pending taskers:', taskers.length);
      } else if (activeTab === 'pending-clients') {
        const clients = await fetchPendingClients();
        setPendingClients(clients);
        console.log('✅ [ADMIN] Loaded pending client tasks:', clients.length);
      } else if (activeTab === 'users') {
        const users = await fetchAllUsers();
        setAllUsers(users);
        console.log('✅ [ADMIN] Loaded all users:', users.length);
      } else if (activeTab === 'pending-transactions') {
        const pendingTxns = await fetchPendingTransactions();
        setPendingTransactions(pendingTxns);
        console.log('✅ [ADMIN] Loaded pending transactions:', pendingTxns.length);
      } else if (activeTab === 'transactions') {
        let transactionData;
        if (dateFilter.start && dateFilter.end) {
          transactionData = await fetchTransactionsByDateRange(dateFilter.start, dateFilter.end);
        } else if (selectedTasker) {
          transactionData = await fetchTransactionsByTasker(selectedTasker);
        } else if (selectedClient) {
          transactionData = await fetchTransactionsByClient(selectedClient);
        } else {
          transactionData = await fetchAllTransactions();
        }
        setTransactions(transactionData);
        console.log('✅ [ADMIN] Loaded transactions:', transactionData.length);
      } else if (activeTab === 'analytics') {
        const analyticsData = await getPlatformAnalytics();
        setAnalytics(analyticsData);
        console.log('✅ [ADMIN] Loaded analytics:', analyticsData);
      }

      // Always load stats
      const statsData = await getAdminStats();
      setStats(statsData);
    } catch (error) {
      console.error('❌ [ADMIN] Error loading data:', error);
      toast({
        title: "Error",
        description: `Failed to load ${activeTab.replace('-', ' ')}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    if (activeTab === 'transactions') {
      loadFilterOptions();
    }
  }, [activeTab, dateFilter, selectedTasker, selectedClient]);

  return {
    pendingTaskers,
    setPendingTaskers,
    pendingClients,
    setPendingClients,
    allUsers,
    pendingTransactions,
    setPendingTransactions,
    transactions,
    analytics,
    stats,
    setStats,
    loading,
    taskers,
    clients,
    loadData,
    loadFilterOptions
  };
};
