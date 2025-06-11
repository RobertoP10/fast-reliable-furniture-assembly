
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
  transactions: Transaction[], 
  isTaskerTable: boolean
) => {
  const [nameFilter, setNameFilter] = useState("");
  const [minRating, setMinRating] = useState("");
  const [minTasks, setMinTasks] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateRangeStart, setDateRangeStart] = useState("");
  const [dateRangeEnd, setDateRangeEnd] = useState("");

  const filteredData = useMemo(() => {
    let filtered = data.filter(item => {
      const nameMatch = item.name.toLowerCase().includes(nameFilter.toLowerCase());
      const ratingMatch = !minRating || item.averageRating >= Number(minRating);
      const taskMatch = !minTasks || item.taskCount >= Number(minTasks);
      
      return nameMatch && ratingMatch && taskMatch;
    });

    // Apply status and date filters based on transactions
    if ((statusFilter !== "all" || dateRangeStart || dateRangeEnd) && transactions.length > 0) {
      filtered = filtered.map(item => {
        const relevantTransactions = transactions.filter(t => {
          const matchesUser = isTaskerTable ? 
            t.tasker?.id === item.id : 
            t.client?.id === item.id;
          
          let matchesStatus = true;
          if (statusFilter !== "all") {
            if (statusFilter === "completed") {
              matchesStatus = t.status === "confirmed" && t.task_requests?.completed_at !== null;
            } else if (statusFilter === "pending") {
              matchesStatus = t.status === "pending";
            } else if (statusFilter === "paid") {
              matchesStatus = t.status === "confirmed";
            }
          }
          
          let matchesDateRange = true;
          if (dateRangeStart || dateRangeEnd) {
            const completedAt = t.task_requests?.completed_at;
            if (completedAt) {
              const transactionDate = new Date(completedAt);
              if (dateRangeStart && transactionDate < new Date(dateRangeStart)) matchesDateRange = false;
              if (dateRangeEnd && transactionDate > new Date(dateRangeEnd)) matchesDateRange = false;
            } else {
              matchesDateRange = false;
            }
          }

          return matchesUser && matchesStatus && matchesDateRange;
        });

        const filteredTaskCount = relevantTransactions.length;
        const filteredAmount = relevantTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
        const filteredCommission = filteredAmount * 0.2;

        return {
          ...item,
          taskCount: filteredTaskCount,
          totalEarnings: isTaskerTable ? filteredAmount : item.totalEarnings,
          totalSpent: !isTaskerTable ? filteredAmount : item.totalSpent,
          totalCommission: filteredCommission
        };
      }).filter(item => item.taskCount > 0);
    }

    return filtered;
  }, [data, nameFilter, minRating, minTasks, statusFilter, dateRangeStart, dateRangeEnd, transactions, isTaskerTable]);

  const totals = useMemo(() => {
    return filteredData.reduce((acc, item) => ({
      taskCount: acc.taskCount + item.taskCount,
      totalAmount: acc.totalAmount + (isTaskerTable ? item.totalEarnings || 0 : item.totalSpent || 0),
      totalCommission: acc.totalCommission + item.totalCommission,
      averageRating: filteredData.length > 0 ? 
        filteredData.reduce((sum, i) => sum + i.averageRating, 0) / filteredData.length : 0
    }), {
      taskCount: 0,
      totalAmount: 0,
      totalCommission: 0,
      averageRating: 0
    });
  }, [filteredData, isTaskerTable]);

  const clearFilters = () => {
    setNameFilter("");
    setMinRating("");
    setMinTasks("");
    setStatusFilter("all");
    setDateRangeStart("");
    setDateRangeEnd("");
  };

  return {
    nameFilter, setNameFilter,
    minRating, setMinRating,
    minTasks, setMinTasks,
    statusFilter, setStatusFilter,
    dateRangeStart, setDateRangeStart,
    dateRangeEnd, setDateRangeEnd,
    filteredData,
    totals,
    clearFilters
  };
};
