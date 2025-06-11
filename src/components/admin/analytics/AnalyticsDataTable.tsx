
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Star } from "lucide-react";

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

interface AnalyticsDataTableProps {
  data: TableData[];
  isTaskerTable: boolean;
  formatCurrency: (amount: number) => string;
  formatDate: (date: string) => string;
}

export const AnalyticsDataTable = ({
  data,
  isTaskerTable,
  formatCurrency,
  formatDate
}: AnalyticsDataTableProps) => {
  return (
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
        {data.length > 0 ? (
          data.map((item, index) => (
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
  );
};
