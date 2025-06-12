
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Users, CheckCircle, X, MapPin } from "lucide-react";
import { approveClientTask, rejectClientTask } from "@/lib/admin";
import { useToast } from "@/hooks/use-toast";

interface PendingClientsTabProps {
  pendingClients: any[];
  setPendingClients: React.Dispatch<React.SetStateAction<any[]>>;
  loading: boolean;
  formatDate: (date: string) => string;
  formatCurrency: (amount: number) => string;
}

export const PendingClientsTab = ({ 
  pendingClients, 
  setPendingClients, 
  loading, 
  formatDate, 
  formatCurrency 
}: PendingClientsTabProps) => {
  const { toast } = useToast();

  const handleApproveTask = async (taskId: string) => {
    try {
      console.log('✅ [ADMIN] Starting task approval for:', taskId);
      await approveClientTask(taskId);
      
      // Remove from pending list immediately
      setPendingClients(prev => prev.filter(task => task.id !== taskId));
      
      toast({
        title: "Task Approved",
        description: "The task has been approved and is now visible to taskers.",
      });
    } catch (error) {
      console.error('❌ [ADMIN] Error approving task:', error);
      toast({
        title: "Error",
        description: `Failed to approve task: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    }
  };

  const handleRejectTask = async (taskId: string) => {
    try {
      console.log('❌ [ADMIN] Starting task rejection for:', taskId);
      await rejectClientTask(taskId, "Location not serviceable");
      
      // Remove from pending list immediately
      setPendingClients(prev => prev.filter(task => task.id !== taskId));
      
      toast({
        title: "Task Rejected",
        description: "The task has been rejected due to location issues.",
      });
    } catch (error) {
      console.error('❌ [ADMIN] Error rejecting task:', error);
      toast({
        title: "Error",
        description: `Failed to reject task: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="shadow-lg border-0">
      <CardHeader>
        <CardTitle className="text-blue-900">Tasks Awaiting Location Review</CardTitle>
        <CardDescription>
          Review and approve tasks with custom locations that are outside standard service areas
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading pending tasks...</p>
          </div>
        ) : pendingClients.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">No pending location reviews</p>
            <p className="text-sm">All tasks with custom locations have been processed.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Task Title</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Price Range</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingClients.map((task) => (
                <TableRow key={task.id}>
                  <TableCell className="font-medium">
                    <div>
                      <div className="font-semibold">{task.title}</div>
                      <div className="text-sm text-gray-500">{task.category}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{task.client?.full_name}</div>
                      <div className="text-sm text-gray-500">{task.client?.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4 text-amber-500" />
                      <div>
                        <div className="font-medium">{task.location}</div>
                        {task.manual_address && (
                          <div className="text-sm text-gray-600">{task.manual_address}</div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {formatCurrency(task.price_range_min)} - {formatCurrency(task.price_range_max)}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(task.created_at)}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        onClick={() => handleApproveTask(task.id)}
                        className="bg-green-600 hover:bg-green-700"
                        title="Approve task"
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleRejectTask(task.id)}
                        title="Reject task"
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
