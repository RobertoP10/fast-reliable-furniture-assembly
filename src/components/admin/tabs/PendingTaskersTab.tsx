
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, CheckCircle, X } from "lucide-react";
import { approveTasker, rejectTasker } from "@/lib/admin";
import { useToast } from "@/hooks/use-toast";

interface PendingTaskersTabProps {
  pendingTaskers: any[];
  setPendingTaskers: React.Dispatch<React.SetStateAction<any[]>>;
  loading: boolean;
  formatDate: (date: string) => string;
}

export const PendingTaskersTab = ({ pendingTaskers, setPendingTaskers, loading, formatDate }: PendingTaskersTabProps) => {
  const { toast } = useToast();

  const handleApproveTasker = async (taskerId: string) => {
    console.log('✅ [ADMIN] UI: Starting tasker approval for:', taskerId);
    
    const taskerToApprove = pendingTaskers.find(t => t.id === taskerId);
    if (!taskerToApprove) {
      toast({
        title: "Error",
        description: "Tasker not found in the current list.",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log('🔄 [ADMIN] UI: Calling approveTasker function...');
      const result = await approveTasker(taskerId);
      
      // Remove from pending list immediately on success
      setPendingTaskers(prev => prev.filter(tasker => tasker.id !== taskerId));
      
      toast({
        title: "Success",
        description: `${taskerToApprove.full_name} has been approved successfully.`,
      });

      console.log('✅ [ADMIN] UI: Approval successful:', result);

    } catch (error) {
      console.error('❌ [ADMIN] UI: Approval error:', error);
      toast({
        title: "Approval Failed",
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: "destructive",
      });
    }
  };

  const handleRejectTasker = async (taskerId: string) => {
    console.log('❌ [ADMIN] UI: Starting tasker rejection for:', taskerId);
    
    const taskerToReject = pendingTaskers.find(t => t.id === taskerId);
    if (!taskerToReject) {
      toast({
        title: "Error",
        description: "Tasker not found in the current list.",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log('🔄 [ADMIN] UI: Calling rejectTasker function...');
      const result = await rejectTasker(taskerId);
      
      // Remove from pending list immediately on success
      setPendingTaskers(prev => prev.filter(tasker => tasker.id !== taskerId));
      
      toast({
        title: "Success",
        description: `${taskerToReject.full_name} has been rejected and removed from the system.`,
      });

      console.log('✅ [ADMIN] UI: Rejection successful:', result);

    } catch (error) {
      console.error('❌ [ADMIN] UI: Rejection error:', error);
      toast({
        title: "Rejection Failed",
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="shadow-lg border-0">
      <CardHeader>
        <CardTitle className="text-blue-900">Taskers Awaiting Approval</CardTitle>
        <CardDescription>
          Review and approve tasker accounts to allow them to start bidding on tasks
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading pending taskers...</p>
          </div>
        ) : pendingTaskers.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">No pending taskers</p>
            <p className="text-sm">All tasker applications have been processed.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Registration Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingTaskers.map((tasker) => (
                <TableRow key={tasker.id}>
                  <TableCell className="font-medium">{tasker.full_name}</TableCell>
                  <TableCell>{tasker.email}</TableCell>
                  <TableCell>{formatDate(tasker.created_at)}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        onClick={() => handleApproveTasker(tasker.id)}
                        className="bg-green-600 hover:bg-green-700"
                        title="Approve tasker"
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleRejectTasker(tasker.id)}
                        title="Reject tasker"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
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
