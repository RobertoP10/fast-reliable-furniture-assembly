
import { useState, useMemo } from "react";

interface TableData {
  id: string;
  name: string;
  taskCount: number;
  totalEarnings?: number;
  totalSpent?: number;
  totalCommission: number;
  lastTaskDate: string | null;
  averageRating: number;
}

interface Transaction {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  task_requests?: {
    completed_at: string | null;
  };
  client?: { id: string; full_name: string };
  tasker?: { id: string; full_name: string };
}

export const useAnalyticsTableFilters = (
  data: TableData[],
  transactions: Transaction[] = [],
  isTaskerTable: boolean = false
) => {
  const [nameFilter, setNameFilter] = useState("");
  const [minRating, setMinRating] = useState("");
  const [minTasks, setMinTasks] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateRangeStart, setDateRangeStart] = useState("");
  const [dateRangeEnd, setDateRangeEnd] = useState("");

  const filteredData = useMemo(() => {
    let filtered = [...data];

    console.log('🔍 [ANALYTICS FILTER] Starting with data:', filtered.length);
    console.log('🔍 [ANALYTICS FILTER] Date range:', { start: dateRangeStart, end: dateRangeEnd });
    console.log('🔍 [ANALYTICS FILTER] Available transactions:', transactions.length);

    // Apply name filter
    if (nameFilter.trim()) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(nameFilter.toLowerCase())
      );
      console.log('🔍 [ANALYTICS FILTER] After name filter:', filtered.length);
    }

    // Apply rating filter
    if (minRating) {
      const minRatingNum = parseFloat(minRating);
      filtered = filtered.filter(item => item.averageRating >= minRatingNum);
      console.log('🔍 [ANALYTICS FILTER] After rating filter:', filtered.length);
    }

    // Apply tasks filter
    if (minTasks) {
      const minTasksNum = parseInt(minTasks);
      filtered = filtered.filter(item => item.taskCount >= minTasksNum);
      console.log('🔍 [ANALYTICS FILTER] After tasks filter:', filtered.length);
    }

    // Apply date range filter - IMPROVED LOGIC using transaction data
    if ((dateRangeStart || dateRangeEnd) && transactions.length > 0) {
      console.log('📅 [ANALYTICS FILTER] Applying date filter using transaction data');
      
      // Get user IDs that have transactions within the date range
      const userIdsWithTransactionsInRange = new Set<string>();
      
      transactions.forEach(transaction => {
        const userId = isTaskerTable ? transaction.tasker?.id : transaction.client?.id;
        if (!userId) return;
        
        // Use completed_at from task_requests if available, otherwise fall back to created_at
        let transactionDate: Date;
        const completedAt = transaction.task_requests?.completed_at;
        
        try {
          if (completedAt) {
            transactionDate = new Date(completedAt);
          } else {
            transactionDate = new Date(transaction.created_at);
          }
          
          if (isNaN(transactionDate.getTime())) {
            console.log('📅 [ANALYTICS FILTER] Invalid date for transaction:', transaction.id);
            return;
          }
        } catch (error) {
          console.log('📅 [ANALYTICS FILTER] Error parsing date for transaction:', transaction.id, error);
          return;
        }
        
        // Normalize transaction date to start of day for comparison
        const transactionDateNormalized = new Date(
          transactionDate.getFullYear(), 
          transactionDate.getMonth(), 
          transactionDate.getDate()
        );
        
        let isInRange = true;
        
        if (dateRangeStart) {
          const startDate = new Date(dateRangeStart);
          const startDateNormalized = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
          
          if (transactionDateNormalized < startDateNormalized) {
            isInRange = false;
          }
        }
        
        if (dateRangeEnd && isInRange) {
          const endDate = new Date(dateRangeEnd);
          const endDateNormalized = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
          
          if (transactionDateNormalized > endDateNormalized) {
            isInRange = false;
          }
        }
        
        if (isInRange) {
          userIdsWithTransactionsInRange.add(userId);
          console.log('📅 [ANALYTICS FILTER] Added user to range:', userId, {
            date: transactionDateNormalized.toISOString(),
            completedAt: completedAt,
            createdAt: transaction.created_at
          });
        }
      });
      
      console.log('📅 [ANALYTICS FILTER] Users with transactions in range:', Array.from(userIdsWithTransactionsInRange));
      
      // Filter data to only include users who have transactions in the date range
      filtered = filtered.filter(item => {
        const isInRange = userIdsWithTransactionsInRange.has(item.id);
        if (!isInRange) {
          console.log('📅 [ANALYTICS FILTER] Filtering out user (no transactions in range):', item.name);
        }
        return isInRange;
      });
      
      console.log('🔍 [ANALYTICS FILTER] After date range filter:', filtered.length);
    }

    // Apply status filter to transactions if provided
    if (statusFilter && transactions.length > 0) {
      const filteredTransactionIds = transactions
        .filter(t => t.status === statusFilter)
        .map(t => isTaskerTable ? t.tasker?.id : t.client?.id)
        .filter(Boolean);

      filtered = filtered.filter(item => 
        filteredTransactionIds.includes(item.id)
      );
      console.log('🔍 [ANALYTICS FILTER] After status filter:', filtered.length);
    }

    console.log('✅ [ANALYTICS FILTER] Final filtered count:', filtered.length);
    return filtered;
  }, [data, nameFilter, minRating, minTasks, statusFilter, dateRangeStart, dateRangeEnd, transactions, isTaskerTable]);

  // Calculate totals based on filtered data and date range
  const totals = useMemo(() => {
    if ((dateRangeStart || dateRangeEnd) && transactions.length > 0) {
      // Calculate totals from transactions within date range for filtered users
      const filteredUserIds = new Set(filteredData.map(item => item.id));
      
      const relevantTransactions = transactions.filter(transaction => {
        const userId = isTaskerTable ? transaction.tasker?.id : transaction.client?.id;
        if (!userId || !filteredUserIds.has(userId)) return false;
        
        // Check if transaction is within date range
        let transactionDate: Date;
        const completedAt = transaction.task_requests?.completed_at;
        
        try {
          if (completedAt) {
            transactionDate = new Date(completedAt);
          } else {
            transactionDate = new Date(transaction.created_at);
          }
          
          if (isNaN(transactionDate.getTime())) return false;
        } catch (error) {
          return false;
        }
        
        const transactionDateNormalized = new Date(
          transactionDate.getFullYear(), 
          transactionDate.getMonth(), 
          transactionDate.getDate()
        );
        
        if (dateRangeStart) {
          const startDate = new Date(dateRangeStart);
          const startDateNormalized = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
          if (transactionDateNormalized < startDateNormalized) return false;
        }
        
        if (dateRangeEnd) {
          const endDate = new Date(dateRangeEnd);
          const endDateNormalized = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
          if (transactionDateNormalized > endDateNormalized) return false;
        }
        
        return true;
      });
      
      console.log('💰 [ANALYTICS FILTER] Calculating totals from transactions in date range:', relevantTransactions.length);
      
      const taskCount = relevantTransactions.length;
      const totalAmount = relevantTransactions.reduce((sum, transaction) => 
        sum + (Number(transaction.amount) || 0), 0
      );
      const totalCommission = totalAmount * 0.2;
      
      return {
        taskCount,
        totalAmount,
        totalCommission
      };
    } else {
      // Use the original calculation when no date filter is applied
      const taskCount = filteredData.reduce((sum, item) => sum + item.taskCount, 0);
      const totalAmount = filteredData.reduce((sum, item) => 
        sum + (isTaskerTable ? (item.totalEarnings || 0) : (item.totalSpent || 0)), 0
      );
      const totalCommission = filteredData.reduce((sum, item) => sum + item.totalCommission, 0);

      return {
        taskCount,
        totalAmount,
        totalCommission
      };
    }
  }, [filteredData, isTaskerTable, transactions, dateRangeStart, dateRangeEnd]);

  const clearFilters = () => {
    console.log('🧹 [ANALYTICS FILTER] Clearing all filters');
    setNameFilter("");
    setMinRating("");
    setMinTasks("");
    setStatusFilter("");
    setDateRangeStart("");
    setDateRangeEnd("");
  };

  return {
    nameFilter,
    setNameFilter,
    minRating,
    setMinRating,
    minTasks,
    setMinTasks,
    statusFilter,
    setStatusFilter,
    dateRangeStart,
    setDateRangeStart,
    dateRangeEnd,
    setDateRangeEnd,
    filteredData,
    totals,
    clearFilters
  };
};
