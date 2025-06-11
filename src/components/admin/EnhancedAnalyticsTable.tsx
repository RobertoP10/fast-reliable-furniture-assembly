
import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Star, Search, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";

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

interface EnhancedAnalyticsTableProps {
  title: string;
  data: TableData[];
  formatCurrency: (amount: number) => string;
  formatDate: (date: string) => string;
  isTaskerTable?: boolean;
  transactions?: Transaction[];
}

export const EnhancedAnalyticsTable = ({ 
  title, 
  data, 
  formatCurrency, 
  formatDate, 
  isTaskerTable = false,
  transactions = []
}: EnhancedAnalyticsTableProps) => {
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
      
      // Date range filter
      let dateMatch = true;
      if (dateRangeStart || dateRangeEnd) {
        if (item.lastTaskDate) {
          const itemDate = new Date(item.lastTaskDate);
          if (dateRangeStart && itemDate < new Date(dateRangeStart)) dateMatch = false;
          if (dateRangeEnd && itemDate > new Date(dateRangeEnd)) dateMatch = false;
        } else {
          dateMatch = false;
        }
      }

      return nameMatch && ratingMatch && taskMatch && dateMatch;
    });

    // Apply status filter by recalculating totals based on filtered transactions
    if (statusFilter !== "all" && transactions.length > 0) {
      filtered = filtered.map(item => {
        const relevantTransactions = transactions.filter(t => {
          const matchesUser = isTaskerTable ? 
            t.tasker?.id === item.id : 
            t.client?.id === item.id;
          
          const matchesStatus = statusFilter === "all" || t.status === statusFilter;
          
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

        // Find most recent task date from filtered transactions
        const filteredLastTaskDate = relevantTransactions.length > 0 ? 
          relevantTransactions
            .filter(t => t.task_requests?.completed_at)
            .sort((a, b) => new Date(b.task_requests!.completed_at!).getTime() - new Date(a.task_requests!.completed_at!).getTime())[0]?.task_requests?.completed_at || null
          : null;

        return {
          ...item,
          taskCount: filteredTaskCount,
          totalEarnings: isTaskerTable ? filteredAmount : item.totalEarnings,
          totalSpent: !isTaskerTable ? filteredAmount : item.totalSpent,
          totalCommission: filteredCommission,
          lastTaskDate: filteredLastTaskDate
        };
      }).filter(item => item.taskCount > 0); // Only show items with tasks in the filtered period
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

  return (
    <Card className="shadow-lg border-0">
      <CardHeader>
        <CardTitle className="text-blue-900">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Advanced Filters */}
        <div className="space-y-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Filter by name..."
                value={nameFilter}
                onChange={(e) => setNameFilter(e.target.value)}
                className="pl-10"
              />
            </div>
            <Input
              type="number"
              placeholder="Min rating (0-5)"
              value={minRating}
              onChange={(e) => setMinRating(e.target.value)}
              min="0"
              max="5"
              step="0.1"
            />
            <Input
              type="number"
              placeholder="Min tasks"
              value={minTasks}
              onChange={(e) => setMinTasks(e.target.value)}
              min="0"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed/Paid</SelectItem>
              </SelectContent>
            </Select>
            
            <div className="relative">
              <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                type="date"
                placeholder="Start date"
                value={dateRangeStart}
                onChange={(e) => setDateRangeStart(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="relative">
              <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                type="date"
                placeholder="End date"
                value={dateRangeEnd}
                onChange={(e) => setDateRangeEnd(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Button variant="outline" onClick={clearFilters}>
              Clear Filters
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="text-lg font-bold text-blue-900">{filteredData.length}</div>
            <div className="text-sm text-blue-600">Total {isTaskerTable ? 'Taskers' : 'Clients'}</div>
          </div>
          <div className="bg-green-50 p-3 rounded-lg">
            <div className="text-lg font-bold text-green-900">{totals.taskCount}</div>
            <div className="text-sm text-green-600">Total Tasks</div>
          </div>
          <div className="bg-purple-50 p-3 rounded-lg">
            <div className="text-lg font-bold text-purple-900">{formatCurrency(totals.totalAmount)}</div>
            <div className="text-sm text-purple-600">Total {isTaskerTable ? 'Earnings' : 'Spent'}</div>
          </div>
          <div className="bg-orange-50 p-3 rounded-lg">
            <div className="text-lg font-bold text-orange-900">{formatCurrency(totals.totalCommission)}</div>
            <div className="text-sm text-orange-600">Total Commission</div>
          </div>
        </div>

        {/* Table */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{isTaskerTable ? 'Tasker' : 'Client'}</TableHead>
              <TableHead>Tasks</TableHead>
              <TableHead>Total {isTaskerTable ? 'Earnings' : 'Spent'}</TableHead>
              <TableHead>Average Rating</TableHead>
              <TableHead>Platform Commission</TableHead>
              <TableHead>Last Task Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length > 0 ? (
              filteredData.map((item, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>{item.taskCount}</TableCell>
                  <TableCell>{formatCurrency(isTaskerTable ? item.totalEarnings || 0 : item.totalSpent || 0)}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Star className="h-4 w-4 mr-1 fill-yellow-400 text-yellow-400" />
                      {item.averageRating > 0 ? item.averageRating.toFixed(1) : 'N/A'}
                    </div>
                  </TableCell>
                  <TableCell>{formatCurrency(item.totalCommission)}</TableCell>
                  <TableCell>
                    {item.lastTaskDate ? formatDate(item.lastTaskDate) : 'N/A'}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                  No data matches your filters
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
