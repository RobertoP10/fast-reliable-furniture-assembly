
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle, X } from "lucide-react";

interface PendingTasker {
  id: string;
  name: string;
  email: string;
  location: string;
  phone: string;
  created_at: string;
}

const AdminPendingTaskers = () => {
  const [pendingTaskers, setPendingTaskers] = useState<PendingTasker[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchPendingTaskers();
  }, []);

  const fetchPendingTaskers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'tasker')
        .or('approved.is.null,approved.eq.false')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching pending taskers:', error);
        return;
      }

      // Filter to only include truly pending taskers (approved is null, false, or 'false')
      const filteredData = (data || []).filter(tasker => {
        if (tasker.approved === null || tasker.approved === undefined) return true;
        if (typeof tasker.approved === 'string') return tasker.approved === 'false';
        if (typeof tasker.approved === 'boolean') return tasker.approved === false;
        return false;
      });

      setPendingTaskers(filteredData);
    } catch (error) {
      console.error('Error fetching pending taskers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (taskerId: string) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ approved: 'true' })
        .eq('id', taskerId);

      if (error) {
        console.error('Error approving tasker:', error);
        toast({
          title: "Error",
          description: "Failed to approve tasker. Please try again.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Tasker approved",
        description: "The tasker has been approved and can now access their dashboard.",
      });

      // Remove from list
      setPendingTaskers(prev => prev.filter(tasker => tasker.id !== taskerId));
    } catch (error) {
      console.error('Error approving tasker:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    }
  };

  const handleReject = async (taskerId: string) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ approved: 'false' })
        .eq('id', taskerId);

      if (error) {
        console.error('Error rejecting tasker:', error);
        toast({
          title: "Error",
          description: "Failed to reject tasker. Please try again.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Tasker rejected",
        description: "The tasker application has been rejected.",
      });

      // Remove from list
      setPendingTaskers(prev => prev.filter(tasker => tasker.id !== taskerId));
    } catch (error) {
      console.error('Error rejecting tasker:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <Card className="shadow-lg border-0">
        <CardHeader>
          <CardTitle className="text-blue-900">Pending Tasker Approvals</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading pending taskers...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (pendingTaskers.length === 0) {
    return (
      <Card className="shadow-lg border-0">
        <CardHeader>
          <CardTitle className="text-blue-900">Pending Tasker Approvals</CardTitle>
          <CardDescription>
            Taskers awaiting approval will appear here
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-gray-600">No pending tasker approvals.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg border-0">
      <CardHeader>
        <CardTitle className="text-blue-900">Pending Tasker Approvals</CardTitle>
        <CardDescription>
          Review and approve new tasker applications
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Applied</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pendingTaskers.map((tasker) => (
              <TableRow key={tasker.id}>
                <TableCell className="font-medium">{tasker.name}</TableCell>
                <TableCell>{tasker.email}</TableCell>
                <TableCell>{tasker.location}</TableCell>
                <TableCell>{tasker.phone}</TableCell>
                <TableCell>{formatDate(tasker.created_at)}</TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      onClick={() => handleApprove(tasker.id)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleReject(tasker.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default AdminPendingTaskers;
