
import { Search, Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface AnalyticsTableFiltersProps {
  nameFilter: string;
  setNameFilter: (value: string) => void;
  minRating: string;
  setMinRating: (value: string) => void;
  minTasks: string;
  setMinTasks: (value: string) => void;
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  dateRangeStart: string;
  setDateRangeStart: (value: string) => void;
  dateRangeEnd: string;
  setDateRangeEnd: (value: string) => void;
  clearFilters: () => void;
}

export const AnalyticsTableFilters = ({
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
  clearFilters
}: AnalyticsTableFiltersProps) => {
  return (
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
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
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
  );
};
