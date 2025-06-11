
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign, Filter } from "lucide-react";

interface TransactionsTabProps {
  transactions: any[];
  loading: boolean;
  formatDate: (date: string) => string;
  formatCurrency: (amount: number) => string;
  dateFilter: { start: string; end: string };
  setDateFilter: (filter: { start: string; end: string }) => void;
  selectedTasker: string;
  setSelectedTasker: (taskerId: string) => void;
  selectedClient: string;
  setSelectedClient: (clientId: string) => void;
  taskers: any[];
  clients: any[];
  clearFilters: () => void;
}

export const TransactionsTab = ({ 
  transactions, 
  loading, 
  formatDate, 
  formatCurrency, 
  dateFilter, 
  setDateFilter, 
  selectedTasker, 
  setSelectedTasker, 
  selectedClient, 
  setSelectedClient, 
  taskers, 
  clients, 
  clearFilters 
}: TransactionsTabProps) => {
  const [showFilters, setShowFilters] = useState(false);

  return (
    <Card className="shadow-lg border-0">
      <CardHeader>
        <CardTitle className="text-blue-900 flex items-center justify-between">
          All Transactions
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
        </CardTitle>
        <CardDescription>
          Monitor and manage platform transactions
        </CardDescription>
        
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <label className="block text-sm font-medium mb-2">Start Date</label>
              <Input
                type="date"
                value={dateFilter.start}
                onChange={(e) => setDateFilter(prev => ({ ...prev, start: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">End Date</label>
              <Input
                type="date"
                value={dateFilter.end}
                onChange={(e) => setDateFilter(prev => ({ ...prev, end: e.target.value }))}
              />
            </div>
            <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
              <div>
                <label className="block text-sm font-medium mb-2">Filter by Tasker</label>
                <Select value={selectedTasker} onValueChange={setSelectedTasker}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a tasker" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Taskers</SelectItem>
                    {taskers.map(tasker => (
                      <SelectItem key={tasker.id} value={tasker.id}>{tasker.full_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Filter by Client</label>
                <Select value={selectedClient} onValueChange={setSelectedClient}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a client" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Clients</SelectItem>
                    {clients.map(client => (
                      <SelectItem key={client.id} value={client.id}>{client.full_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button variant="outline" onClick={clearFilters}>
                  Clear Filters
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading transactions...</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <DollarSign className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">No transactions found</p>
            <p className="text-sm">No transactions match your current filters.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Task</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Tasker</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell className="font-medium">
                    {transaction.task_requests?.title || 'Unknown Task'}
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{transaction.client?.full_name || 'Unknown Client'}</div>
                      <div className="text-sm text-gray-500">{transaction.client?.email || 'No email'}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{transaction.tasker?.full_name || 'Unknown Tasker'}</div>
                      <div className="text-sm text-gray-500">{transaction.tasker?.email || 'No email'}</div>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{formatCurrency(Number(transaction.amount))}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={
                      transaction.payment_method === 'cash' ? 'text-green-700' : 'text-blue-700'
                    }>
                      {transaction.payment_method === 'cash' ? 'Cash' : 'Transfer'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={
                      transaction.status === 'confirmed' ? 'bg-green-100 text-green-700' : 
                      transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'
                    }>
                      {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(transaction.created_at)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};
