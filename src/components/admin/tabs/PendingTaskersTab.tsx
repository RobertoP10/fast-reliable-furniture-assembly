
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
    try {
      console.log('✅ [ADMIN] Starting tasker approval for:', taskerId);
      console.log('📋 [ADMIN] Current pending taskers count:', pendingTaskers.length);
      
      // Find the tasker in the current list
      const taskerToApprove = pendingTaskers.find(t => t.id === taskerId);
      console.log('📋 [ADMIN] Tasker to approve:', taskerToApprove);
      
      if (!taskerToApprove) {
        console.error('❌ [ADMIN] Tasker not found in current list:', taskerId);
        toast({
          title: "Error",
          description: "Tasker not found in the current list. Please refresh and try again.",
          variant: "destructive",
        });
        return;
      }

      // Show optimistic UI update immediately
      setPendingTaskers(prev => {
        const updated = prev.filter(tasker => tasker.id !== taskerId);
        console.log('🔄 [ADMIN] Optimistically updated pending list length:', updated.length);
        return updated;
      });

      // Show immediate success message
      toast({
        title: "Approving Tasker...",
        description: `Approving ${taskerToApprove.full_name}...`,
      });

      // Perform the actual approval
      const result = await approveTasker(taskerId);
      console.log('✅ [ADMIN] Approval result:', result);
      
      // Show final success message
      toast({
        title: "Tasker Approved",
        description: `${taskerToApprove.full_name} has been successfully approved and can now start bidding on tasks.`,
      });

    } catch (error) {
      console.error('❌ [ADMIN] Error approving tasker:', error);
      
      // Revert the optimistic update on error
      const originalTasker = pendingTaskers.find(t => t.id === taskerId);
      if (originalTasker) {
        setPendingTaskers(prev => [...prev, originalTasker].sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        ));
      }
      
      toast({
        title: "Approval Failed",
        description: `Failed to approve tasker: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    }
  };

  const handleRejectTasker = async (taskerId: string) => {
    try {
      console.log('❌ [ADMIN] Starting tasker rejection for:', taskerId);
      
      // Find the tasker in the current list
      const taskerToReject = pendingTaskers.find(t => t.id === taskerId);
      console.log('📋 [ADMIN] Tasker to reject:', taskerToReject);
      
      if (!taskerToReject) {
        console.error('❌ [ADMIN] Tasker not found in current list:', taskerId);
        toast({
          title: "Error",
          description: "Tasker not found in the current list. Please refresh and try again.",
          variant: "destructive",
        });
        return;
      }

      await rejectTasker(taskerId);
      
      // Remove from pending list immediately for instant UI feedback
      setPendingTaskers(prev => {
        const updated = prev.filter(tasker => tasker.id !== taskerId);
        console.log('✅ [ADMIN] Updated pending list length after rejection:', updated.length);
        return updated;
      });
      
      toast({
        title: "Tasker Rejected",
        description: `${taskerToReject.full_name}'s application has been rejected and the account has been removed.`,
      });
    } catch (error) {
      console.error('❌ [ADMIN] Error rejecting tasker:', error);
      toast({
        title: "Error",
        description: `Failed to reject tasker: ${error instanceof Error ? error.message : 'Unknown error'}`,
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
