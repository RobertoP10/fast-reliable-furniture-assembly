
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Clock, CheckCircle } from "lucide-react";
import { confirmTransaction } from "@/lib/adminApi";
import { useToast } from "@/hooks/use-toast";

interface PendingTransactionsTabProps {
  pendingTransactions: any[];
  setPendingTransactions: React.Dispatch<React.SetStateAction<any[]>>;
  setStats: React.Dispatch<React.SetStateAction<any>>;
  loading: boolean;
  formatDate: (date: string) => string;
  formatCurrency: (amount: number) => string;
}

export const PendingTransactionsTab = ({ 
  pendingTransactions, 
  setPendingTransactions, 
  setStats, 
  loading, 
  formatDate, 
  formatCurrency 
}: PendingTransactionsTabProps) => {
  const { toast } = useToast();

  const handleConfirmTransaction = async (transactionId: string) => {
    try {
      console.log('✅ [ADMIN] Confirming transaction:', transactionId);
      
      await confirmTransaction(transactionId);
      
      // Remove transaction from pending list
      setPendingTransactions(prev => prev.filter(transaction => transaction.id !== transactionId));
      
      toast({
        title: "Transaction Confirmed",
        description: "The transaction has been confirmed and marked as paid.",
      });

      // Update stats to reflect the confirmed transaction
      const confirmedTransaction = pendingTransactions.find(t => t.id === transactionId);
      if (confirmedTransaction) {
        setStats(prev => ({
          ...prev,
          totalRevenue: prev.totalRevenue + Number(confirmedTransaction.amount)
        }));
      }

    } catch (error) {
      console.error('❌ [ADMIN] Error confirming transaction:', error);
      toast({
        title: "Error",
        description: `Failed to confirm transaction: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="shadow-lg border-0">
      <CardHeader>
        <CardTitle className="text-blue-900">Pending Transactions</CardTitle>
        <CardDescription>
          Review and confirm completed transactions that are awaiting payment verification
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading pending transactions...</p>
          </div>
        ) : pendingTransactions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">No pending transactions</p>
            <p className="text-sm">All transactions have been processed.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Task Title</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Tasker</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Payment Method</TableHead>
                <TableHead>Completed Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingTransactions.map((transaction) => (
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
                  <TableCell className="font-medium">
                    {formatCurrency(Number(transaction.amount))}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={
                      transaction.payment_method === 'cash' ? 'text-green-700' : 'text-blue-700'
                    }>
                      {transaction.payment_method === 'cash' ? 'Cash' : 
                       transaction.payment_method === 'bank_transfer' ? 'Bank Transfer' : 'Card'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {transaction.task_requests?.completed_at ? 
                      formatDate(transaction.task_requests.completed_at) : 
                      'Not completed yet'
                    }
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      onClick={() => handleConfirmTransaction(transaction.id)}
                      className="bg-green-600 hover:bg-green-700"
                      title="Mark as paid"
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Mark as Paid
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};
