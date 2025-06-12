
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle, XCircle, MapPin, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { approveClientTask, rejectClientTask } from "@/lib/adminPendingClients";

interface PendingClientsTabProps {
  pendingClients: any[];
  setPendingClients: (clients: any[]) => void;
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

  const handleApprove = async (taskId: string) => {
    try {
      await approveClientTask(taskId);
      setPendingClients(pendingClients.filter(task => task.id !== taskId));
      toast({
        title: "Task Approved",
        description: "The client task has been approved and is now visible to taskers.",
      });
    } catch (error) {
      console.error('Error approving client task:', error);
      toast({
        title: "Error",
        description: "Failed to approve task. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleReject = async (taskId: string) => {
    try {
      await rejectClientTask(taskId);
      setPendingClients(pendingClients.filter(task => task.id !== taskId));
      toast({
        title: "Task Rejected",
        description: "The client task has been rejected.",
      });
    } catch (error) {
      console.error('Error rejecting client task:', error);
      toast({
        title: "Error", 
        description: "Failed to reject task. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="shadow-lg border-0">
      <CardHeader>
        <CardTitle className="text-blue-900">Pending Client Tasks</CardTitle>
        <CardDescription>
          Review and approve tasks from clients with locations outside the standard service area
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading pending client tasks...</p>
          </div>
        ) : pendingClients.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">No pending client tasks</p>
            <p className="text-sm">All client tasks with custom locations have been reviewed.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Task</TableHead>
                <TableHead>Budget</TableHead>
                <TableHead>Manual Address</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingClients.map((task) => (
                <TableRow key={task.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{task.client?.full_name || 'Unknown'}</p>
                      <p className="text-sm text-gray-500">{task.client?.email || 'No email'}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{task.title}</p>
                      <p className="text-sm text-gray-500">{task.category} - {task.subcategory}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-green-700 border-green-300">
                      {formatCurrency(task.price_range_min)} - {formatCurrency(task.price_range_max)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-start space-x-2">
                      <MapPin className="h-4 w-4 mt-0.5 text-orange-500 flex-shrink-0" />
                      <p className="text-sm">{task.manual_address || 'No address provided'}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {formatDate(task.created_at)}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        onClick={() => handleApprove(task.id)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleReject(task.id)}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Reject
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
