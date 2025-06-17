
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
    console.log('🔍 [ANALYTICS FILTER] Sample data dates:', filtered.slice(0, 3).map(item => ({ name: item.name, lastTaskDate: item.lastTaskDate })));

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

    // Apply date range filter - IMPROVED LOGIC
    if (dateRangeStart || dateRangeEnd) {
      filtered = filtered.filter(item => {
        if (!item.lastTaskDate) {
          console.log('📅 [ANALYTICS FILTER] No lastTaskDate for item:', item.name);
          return false;
        }

        // Parse the lastTaskDate - handle both ISO strings and date objects
        let taskDate: Date;
        try {
          // Try parsing as ISO string first
          taskDate = new Date(item.lastTaskDate);
          
          // Check if date is valid
          if (isNaN(taskDate.getTime())) {
            console.log('📅 [ANALYTICS FILTER] Invalid date for item:', item.name, item.lastTaskDate);
            return false;
          }
        } catch (error) {
          console.log('📅 [ANALYTICS FILTER] Error parsing date for item:', item.name, item.lastTaskDate, error);
          return false;
        }

        // Normalize taskDate to start of day for comparison
        const taskDateNormalized = new Date(taskDate.getFullYear(), taskDate.getMonth(), taskDate.getDate());
        
        console.log('📅 [ANALYTICS FILTER] Processing item:', item.name, {
          originalDate: item.lastTaskDate,
          parsedDate: taskDate.toISOString(),
          normalizedDate: taskDateNormalized.toISOString()
        });
        
        if (dateRangeStart) {
          const startDate = new Date(dateRangeStart);
          const startDateNormalized = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
          
          if (taskDateNormalized < startDateNormalized) {
            console.log('📅 [ANALYTICS FILTER] Task date before start:', {
              taskDate: taskDateNormalized.toISOString(),
              startDate: startDateNormalized.toISOString(),
              item: item.name
            });
            return false;
          }
        }
        
        if (dateRangeEnd) {
          const endDate = new Date(dateRangeEnd);
          const endDateNormalized = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
          
          if (taskDateNormalized > endDateNormalized) {
            console.log('📅 [ANALYTICS FILTER] Task date after end:', {
              taskDate: taskDateNormalized.toISOString(),
              endDate: endDateNormalized.toISOString(),
              item: item.name
            });
            return false;
          }
        }
        
        console.log('📅 [ANALYTICS FILTER] Date match for item:', item.name);
        return true;
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

  const totals = useMemo(() => {
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
  }, [filteredData, isTaskerTable]);

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
