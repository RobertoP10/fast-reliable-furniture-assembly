
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AnalyticsTableFilters } from "./analytics/AnalyticsTableFilters";
import { AnalyticsSummaryCards } from "./analytics/AnalyticsSummaryCards";
import { AnalyticsDataTable } from "./analytics/AnalyticsDataTable";
import { useAnalyticsTableFilters } from "./analytics/useAnalyticsTableFilters";

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
  const {
    nameFilter, setNameFilter,
    minRating, setMinRating,
    minTasks, setMinTasks,
    statusFilter, setStatusFilter,
    dateRangeStart, setDateRangeStart,
    dateRangeEnd, setDateRangeEnd,
    filteredData,
    totals,
    clearFilters
  } = useAnalyticsTableFilters(data, transactions, isTaskerTable);

  return (
    <Card className="shadow-lg border-0">
      <CardHeader>
        <CardTitle className="text-blue-900">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <AnalyticsTableFilters
          nameFilter={nameFilter}
          setNameFilter={setNameFilter}
          minRating={minRating}
          setMinRating={setMinRating}
          minTasks={minTasks}
          setMinTasks={setMinTasks}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          dateRangeStart={dateRangeStart}
          setDateRangeStart={setDateRangeStart}
          dateRangeEnd={dateRangeEnd}
          setDateRangeEnd={setDateRangeEnd}
          clearFilters={clearFilters}
        />

        <AnalyticsSummaryCards
          totalUsers={filteredData.length}
          totalTasks={totals.taskCount}
          totalAmount={totals.totalAmount}
          totalCommission={totals.totalCommission}
          isTaskerTable={isTaskerTable}
          formatCurrency={formatCurrency}
        />

        <AnalyticsDataTable
          data={filteredData}
          isTaskerTable={isTaskerTable}
          formatCurrency={formatCurrency}
          formatDate={formatDate}
        />
      </CardContent>
    </Card>
  );
};
