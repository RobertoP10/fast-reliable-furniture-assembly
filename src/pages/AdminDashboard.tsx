
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { fetchPendingTaskers, approveTasker, rejectTasker } from "@/lib/adminApi";
import { Wrench, Users, CheckCircle, X, Eye, User, LogOut } from "lucide-react";

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'pending-taskers' | 'users' | 'transactions'>('pending-taskers');
  const [pendingTaskers, setPendingTaskers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch pending taskers
  useEffect(() => {
    const loadPendingTaskers = async () => {
      if (activeTab === 'pending-taskers') {
        setLoading(true);
        try {
          console.log('🔄 [ADMIN] Loading pending taskers...');
          const taskers = await fetchPendingTaskers();
          setPendingTaskers(taskers);
          console.log('✅ [ADMIN] Loaded pending taskers:', taskers.length);
        } catch (error) {
          console.error('❌ [ADMIN] Error fetching pending taskers:', error);
          toast({
            title: "Error",
            description: "Failed to load pending taskers.",
            variant: "destructive",
          });
        } finally {
          setLoading(false);
        }
      }
    };

    loadPendingTaskers();
  }, [activeTab, toast]);

  const handleApproveTasker = async (taskerId: string) => {
    try {
      console.log('✅ [ADMIN] Approving tasker:', taskerId);
      await approveTasker(taskerId);
      setPendingTaskers(prev => prev.filter(tasker => tasker.id !== taskerId));
      toast({
        title: "Tasker Approved",
        description: "The tasker has been successfully approved and can now start bidding on tasks.",
      });
    } catch (error) {
      console.error('❌ [ADMIN] Error approving tasker:', error);
      toast({
        title: "Error",
        description: "Failed to approve tasker. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleRejectTasker = async (taskerId: string) => {
    try {
      console.log('❌ [ADMIN] Rejecting tasker:', taskerId);
      await rejectTasker(taskerId);
      setPendingTaskers(prev => prev.filter(tasker => tasker.id !== taskerId));
      toast({
        title: "Tasker Rejected",
        description: "The tasker application has been rejected and the account has been removed.",
      });
    } catch (error) {
      console.error('❌ [ADMIN] Error rejecting tasker:', error);
      toast({
        title: "Error",
        description: "Failed to reject tasker. Please try again.",
        variant: "destructive",
      });
    }
  };

  const mockUsers = [
    {
      id: '1',
      name: 'John Client',
      email: 'client@email.com',
      role: 'client',
      status: 'active',
      tasksCompleted: 5,
      joinedAt: new Date(Date.now() - 2592000000)
    },
    {
      id: '2',
      name: 'Anna Tasker',
      email: 'anna@email.com',
      role: 'tasker',
      status: 'active',
      tasksCompleted: 12,
      joinedAt: new Date(Date.now() - 5184000000)
    }
  ];

  const mockTransactions = [
    {
      id: '1',
      taskTitle: 'PAX Wardrobe Assembly',
      client: 'John Client',
      tasker: 'Anna Tasker',
      amount: 200,
      paymentMethod: 'bank',
      status: 'pending',
      createdAt: new Date(Date.now() - 86400000)
    },
    {
      id: '2',
      taskTitle: 'Desk Assembly',
      client: 'Mary Client',
      tasker: 'Andrew Tasker',
      amount: 150,
      paymentMethod: 'cash',
      status: 'confirmed',
      createdAt: new Date(Date.now() - 172800000)
    }
  ];

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }).format(date);
  };

  const handleConfirmTransaction = (id: string) => {
    console.log('Confirming transaction:', id);
  };

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
                <span className="text-sm font-medium">{user?.name}</span>
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
                            <TableCell>{tasker.location || 'Not specified'}</TableCell>
                            <TableCell>{formatDate(new Date(tasker.created_at))}</TableCell>
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
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Tasks</TableHead>
                        <TableHead>Member Since</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mockUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.name}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={
                              user.role === 'client' ? 'text-blue-700' : 'text-green-700'
                            }>
                              {user.role === 'client' ? 'Client' : 'Tasker'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className="bg-green-100 text-green-700">
                              {user.status === 'active' ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell>{user.tasksCompleted}</TableCell>
                          <TableCell>{formatDate(user.joinedAt)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
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
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Task</TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead>Tasker</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Payment</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mockTransactions.map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell className="font-medium">{transaction.taskTitle}</TableCell>
                          <TableCell>{transaction.client}</TableCell>
                          <TableCell>{transaction.tasker}</TableCell>
                          <TableCell>£{transaction.amount}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {transaction.paymentMethod === 'cash' ? 'Cash' : 'Transfer'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={
                              transaction.status === 'confirmed' 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-yellow-100 text-yellow-700'
                            }>
                              {transaction.status === 'confirmed' ? 'Confirmed' : 'Pending'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {transaction.status === 'pending' && transaction.paymentMethod === 'bank' && (
                              <Button
                                size="sm"
                                onClick={() => handleConfirmTransaction(transaction.id)}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                Confirm
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
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
