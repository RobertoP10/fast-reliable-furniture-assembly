
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, CheckCircle, X } from "lucide-react";
import { acceptTasker, rejectTasker } from "@/lib/adminApi";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

interface PendingTaskersTabProps {
  pendingTaskers: any[];
  setPendingTaskers: React.Dispatch<React.SetStateAction<any[]>>;
  loading: boolean;
  formatDate: (date: string) => string;
}

export const PendingTaskersTab = ({ pendingTaskers, setPendingTaskers, loading, formatDate }: PendingTaskersTabProps) => {
  const { toast } = useToast();
  const [processingTaskers, setProcessingTaskers] = useState<Set<string>>(new Set());

  const handleApproveTasker = async (taskerId: string, taskerName: string) => {
    console.log('🎯 [UI] APPROVE BUTTON CLICKED for:', { taskerId, taskerName });
    
    if (processingTaskers.has(taskerId)) {
      console.log('⏸️ [UI] Already processing this tasker, skipping...');
      return;
    }
    
    setProcessingTaskers(prev => new Set(prev).add(taskerId));
    
    try {
      console.log('📤 [UI] Calling acceptTasker API...');
      const result = await acceptTasker(taskerId);
      
      console.log('✅ [UI] API call successful, result:', result);
      
      // Remove from pending list
      setPendingTaskers(prev => {
        const updated = prev.filter(tasker => tasker.id !== taskerId);
        console.log('📝 [UI] Updated pending list, removed tasker, remaining:', updated.length);
        return updated;
      });
      
      toast({
        title: "✅ Tasker Approved",
        description: `${taskerName} has been approved successfully!`,
      });
      
    } catch (error) {
      console.error('❌ [UI] Approval failed with error:', error);
      
      let errorMessage = 'Failed to approve tasker';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast({
        title: "❌ Approval Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setProcessingTaskers(prev => {
        const newSet = new Set(prev);
        newSet.delete(taskerId);
        return newSet;
      });
    }
  };

  const handleRejectTasker = async (taskerId: string, taskerName: string) => {
    console.log('🎯 [UI] REJECT BUTTON CLICKED for:', { taskerId, taskerName });
    
    if (processingTaskers.has(taskerId)) {
      console.log('⏸️ [UI] Already processing this tasker, skipping...');
      return;
    }
    
    setProcessingTaskers(prev => new Set(prev).add(taskerId));
    
    try {
      console.log('📤 [UI] Calling rejectTasker API...');
      await rejectTasker(taskerId);
      
      console.log('✅ [UI] API call successful');
      
      // Remove from pending list
      setPendingTaskers(prev => {
        const updated = prev.filter(tasker => tasker.id !== taskerId);
        console.log('📝 [UI] Updated pending list, removed tasker, remaining:', updated.length);
        return updated;
      });
      
      toast({
        title: "✅ Tasker Rejected",
        description: `${taskerName} has been rejected and removed.`,
      });
      
    } catch (error) {
      console.error('❌ [UI] Rejection failed with error:', error);
      
      let errorMessage = 'Failed to reject tasker';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast({
        title: "❌ Rejection Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setProcessingTaskers(prev => {
        const newSet = new Set(prev);
        newSet.delete(taskerId);
        return newSet;
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
                <TableHead>ID (Debug)</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingTaskers.map((tasker) => {
                const isProcessing = processingTaskers.has(tasker.id);
                
                console.log('🗂️ [UI] Rendering tasker row:', {
                  id: tasker.id,
                  name: tasker.full_name,
                  email: tasker.email,
                  role: tasker.role,
                  approved: tasker.approved,
                  isProcessing
                });
                
                return (
                  <TableRow key={tasker.id}>
                    <TableCell className="font-medium">{tasker.full_name}</TableCell>
                    <TableCell>{tasker.email}</TableCell>
                    <TableCell>{formatDate(tasker.created_at)}</TableCell>
                    <TableCell className="text-xs text-gray-500 max-w-[100px] truncate" title={tasker.id}>
                      {tasker.id}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          onClick={() => handleApproveTasker(tasker.id, tasker.full_name)}
                          disabled={isProcessing}
                          className="bg-green-600 hover:bg-green-700 disabled:opacity-50"
                          title="Approve tasker"
                        >
                          <CheckCircle className="h-4 w-4" />
                          {isProcessing ? "..." : ""}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleRejectTasker(tasker.id, tasker.full_name)}
                          disabled={isProcessing}
                          className="disabled:opacity-50"
                          title="Reject tasker"
                        >
                          <X className="h-4 w-4" />
                          {isProcessing ? "..." : ""}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};
