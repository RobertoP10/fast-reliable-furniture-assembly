
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Wrench, Users, CheckCircle, X, Eye, User as UserIcon, LogOut } from "lucide-react";
import type { User, Transaction } from "@/types/database";

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'pending-taskers' | 'users' | 'transactions'>('pending-taskers');
  const [pendingTaskers, setPendingTaskers] = useState<User[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      console.log('Fetching admin dashboard data...');
      
      // Fetch pending taskers (approved = false)
      const { data: pendingTaskersData, error: taskersError } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'tasker')
        .eq('approved', false)
        .order('created_at', { ascending: false });

      if (taskersError) {
        console.error('Error fetching pending taskers:', taskersError);
        toast({
          title: "Error",
          description: "Failed to fetch pending taskers",
          variant: "destructive",
        });
      } else {
        console.log('Pending taskers fetched:', pendingTaskersData);
        setPendingTaskers(pendingTaskersData || []);
      }

      // Fetch all users
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (usersError) {
        console.error('Error fetching users:', usersError);
        toast({
          title: "Error",
          description: "Failed to fetch users",
          variant: "destructive",
        });
      } else {
        console.log('All users fetched:', usersData);
        setAllUsers(usersData || []);
      }

      // Fetch transactions
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false });

      if (transactionsError) {
        console.error('Error fetching transactions:', transactionsError);
        toast({
          title: "Error",
          description: "Failed to fetch transactions",
          variant: "destructive",
        });
      } else {
        console.log('Transactions fetched:', transactionsData);
        setTransactions(transactionsData || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApproveTasker = async (id: string) => {
    try {
      console.log('Approving tasker:', id);
      const { error } = await supabase
        .from('users')
        .update({ approved: true })
        .eq('id', id);

      if (error) {
        console.error('Error approving tasker:', error);
        toast({
          title: "Error",
          description: "Failed to approve tasker",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Tasker approved successfully",
        });
        // Refresh data
        await fetchData();
      }
    } catch (error) {
      console.error('Error approving tasker:', error);
      toast({
        title: "Error",
        description: "Failed to approve tasker",
        variant: "destructive",
      });
    }
  };

  const handleRejectTasker = async (id: string) => {
    try {
      console.log('Rejecting tasker:', id);
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error rejecting tasker:', error);
        toast({
          title: "Error",
          description: "Failed to reject tasker",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Tasker rejected and removed",
        });
        // Refresh data
        await fetchData();
      }
    } catch (error) {
      console.error('Error rejecting tasker:', error);
      toast({
        title: "Error",
        description: "Failed to reject tasker",
        variant: "destructive",
      });
    }
  };

  const handleConfirmTransaction = async (id: string) => {
    try {
      console.log('Confirming transaction:', id);
      const { error } = await supabase
        .from('transactions')
        .update({ status: 'completed' })
        .eq('id', id);

      if (error) {
        console.error('Error confirming transaction:', error);
        toast({
          title: "Error",
          description: "Failed to confirm transaction",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Transaction confirmed",
        });
        // Refresh data
        await fetchData();
      }
    } catch (error) {
      console.error('Error confirming transaction:', error);
      toast({
        title: "Error",
        description: "Failed to confirm transaction",
        variant: "destructive",
      });
    }
  };

  const formatDate = (date: string) => {
    return new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }).format(new Date(date));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
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
                <UserIcon className="h-4 w-4 text-gray-600" />
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
                  <span className="text-sm text-gray-600">Total users</span>
                  <Badge className="bg-green-100 text-green-700">{allUsers.length}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Pending transactions</span>
                  <Badge className="bg-blue-100 text-blue-700">
                    {transactions.filter(t => t.status === 'pending').length}
                  </Badge>
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
                      <p className="text-gray-500">No pending taskers to review</p>
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
                            <TableCell>{formatDate(tasker.created_at!)}</TableCell>
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
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Member Since</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.name}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={
                              user.role === 'client' ? 'text-blue-700' : 
                              user.role === 'tasker' ? 'text-green-700' : 'text-purple-700'
                            }>
                              {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={
                              user.approved ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                            }>
                              {user.approved ? 'Active' : 'Pending'}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatDate(user.created_at!)}</TableCell>
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
                  {transactions.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500">No transactions found</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Amount</TableHead>
                          <TableHead>Payment Method</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {transactions.map((transaction) => (
                          <TableRow key={transaction.id}>
                            <TableCell className="font-medium">£{transaction.amount}</TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {transaction.payment_method === 'cash' ? 'Cash' : 
                                 transaction.payment_method === 'card' ? 'Card' : 'Transfer'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge className={
                                transaction.status === 'completed' 
                                  ? 'bg-green-100 text-green-700' 
                                  : 'bg-yellow-100 text-yellow-700'
                              }>
                                {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                              </Badge>
                            </TableCell>
                            <TableCell>{formatDate(transaction.created_at!)}</TableCell>
                            <TableCell>
                              {transaction.status === 'pending' && transaction.payment_method === 'bank_transfer' && (
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
                  )}
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
