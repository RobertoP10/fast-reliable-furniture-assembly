import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Wrench, Users, CheckCircle, X, Eye, User, LogOut } from "lucide-react";

interface PendingTasker {
  id: string;
  name: string;
  email: string;
  location: string;
  created_at: string;
  approved: string | null;
}

const AdminDashboard = () => {
  const { user, session, logout, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'pending-taskers' | 'users' | 'transactions'>('pending-taskers');
  const [pendingTaskers, setPendingTaskers] = useState<PendingTasker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Only fetch data when we have a session and user
    if (session && user?.id) {
      console.log('Fetching admin data for user:', user.id);
      fetchPendingTaskers();
    } else if (!authLoading) {
      // If auth is done loading but no session, there's an error
      setError('User session not found');
      setLoading(false);
    }
  }, [session, user, authLoading]);

  const fetchPendingTaskers = async () => {
    if (!user?.id) {
      setError('User ID not available');
      setLoading(false);
      return;
    }

    try {
      console.log('Fetching pending taskers...');
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'tasker')
        .or('approved.is.null,approved.eq.NULL')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching pending taskers:', error);
        setError('Failed to load pending taskers');
        return;
      }

      console.log('Pending taskers found:', data?.length || 0);
      setPendingTaskers(data || []);
      setError(null);
    } catch (error) {
      console.error('Error fetching pending taskers:', error);
      setError('Failed to load pending taskers');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: string) => {
    return new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }).format(new Date(date));
  };

  const handleApproveTasker = async (id: string) => {
    try {
      console.log('Approving tasker:', id);
      const { error } = await supabase
        .from('users')
        .update({ approved: 'true' })
        .eq('id', id);

      if (error) {
        console.error('Error approving tasker:', error);
        toast({
          title: "Error",
          description: "Failed to approve tasker.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Tasker approved successfully.",
      });

      fetchPendingTaskers();
    } catch (error) {
      console.error('Error approving tasker:', error);
      toast({
        title: "Error",
        description: "Failed to approve tasker.",
        variant: "destructive",
      });
    }
  };

  const handleRejectTasker = async (id: string) => {
    try {
      console.log('Rejecting tasker:', id);
      const { error } = await supabase
        .from('users')
        .update({ approved: 'false' })
        .eq('id', id);

      if (error) {
        console.error('Error rejecting tasker:', error);
        toast({
          title: "Error",
          description: "Failed to reject tasker.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Tasker rejected successfully.",
      });

      fetchPendingTaskers();
    } catch (error) {
      console.error('Error rejecting tasker:', error);
      toast({
        title: "Error",
        description: "Failed to reject tasker.",
        variant: "destructive",
      });
    }
  };

  // Show loading while auth or data is loading
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <Wrench className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">Error: {error}</div>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  // Don't render if no user (should be handled by ProtectedRoute but just in case)
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-blue-100 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Wrench className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                MGSDEAL
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium">{user.name}</span>
                <Badge className="bg-purple-100 text-purple-700">Admin</Badge>
              </div>
              <Button variant="ghost" size="sm" onClick={logout}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle className="text-blue-900">Admin Panel</CardTitle>
                <CardDescription>Manage the platform</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant={activeTab === 'pending-taskers' ? 'default' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setActiveTab('pending-taskers')}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Pending Taskers
                </Button>
                <Button
                  variant={activeTab === 'users' ? 'default' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setActiveTab('users')}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Users
                </Button>
                <Button
                  variant={activeTab === 'transactions' ? 'default' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setActiveTab('transactions')}
                >
                  Transactions
                </Button>
              </CardContent>
            </Card>

            {/* Stats Card */}
            <Card className="shadow-lg border-0 mt-6">
              <CardHeader>
                <CardTitle className="text-blue-900 text-lg">Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Pending taskers</span>
                  <Badge className="bg-yellow-100 text-yellow-700">{pendingTaskers.length}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Active users</span>
                  <Badge className="bg-green-100 text-green-700">248</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Pending transactions</span>
                  <Badge className="bg-blue-100 text-blue-700">5</Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {activeTab === 'pending-taskers' && (
              <Card className="shadow-lg border-0">
                <CardHeader>
                  <CardTitle className="text-blue-900">Taskers Awaiting Approval</CardTitle>
                  <CardDescription>
                    Review and approve tasker accounts
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {pendingTaskers.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500">No pending taskers to review.</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Location</TableHead>
                          <TableHead>Registration Date</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pendingTaskers.map((tasker) => (
                          <TableRow key={tasker.id}>
                            <TableCell className="font-medium">{tasker.name}</TableCell>
                            <TableCell>{tasker.email}</TableCell>
                            <TableCell>{tasker.location}</TableCell>
                            <TableCell>{formatDate(tasker.created_at)}</TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleApproveTasker(tasker.id)}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleRejectTasker(tasker.id)}
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
            )}

            {activeTab === 'users' && (
              <Card className="shadow-lg border-0">
                <CardHeader>
                  <CardTitle className="text-blue-900">All Users</CardTitle>
                  <CardDescription>
                    View and manage platform users
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-500">User management coming soon...</p>
                </CardContent>
              </Card>
            )}

            {activeTab === 'transactions' && (
              <Card className="shadow-lg border-0">
                <CardHeader>
                  <CardTitle className="text-blue-900">Transactions</CardTitle>
                  <CardDescription>
                    Manage and confirm transactions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-500">Transaction management coming soon...</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
