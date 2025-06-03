
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { fetchPendingTaskers, fetchAllUsers, fetchPendingTransactions, acceptTasker, rejectTasker } from "@/lib/api";
import { Wrench, Users, CheckCircle, X, Eye, User, LogOut, TrendingUp, DollarSign, Clock } from "lucide-react";

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'pending-taskers' | 'users' | 'transactions'>('pending-taskers');
  const [pendingTaskers, setPendingTaskers] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [pendingTransactions, setPendingTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Load data based on active tab
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        console.log('🔄 [ADMIN] Loading data for tab:', activeTab);
        
        if (activeTab === 'pending-taskers') {
          const taskers = await fetchPendingTaskers();
          setPendingTaskers(taskers);
          console.log('✅ [ADMIN] Loaded pending taskers:', taskers.length);
        } else if (activeTab === 'users') {
          const users = await fetchAllUsers();
          setAllUsers(users);
          console.log('✅ [ADMIN] Loaded all users:', users.length);
        } else if (activeTab === 'transactions') {
          const transactions = await fetchPendingTransactions();
          setPendingTransactions(transactions);
          console.log('✅ [ADMIN] Loaded transactions:', transactions.length);
        }
      } catch (error) {
        console.error('❌ [ADMIN] Error loading data:', error);
        toast({
          title: "Error",
          description: `Failed to load ${activeTab.replace('-', ' ')}: ${error instanceof Error ? error.message : 'Unknown error'}`,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [activeTab, toast]);

  const handleApproveTasker = async (taskerId: string) => {
    try {
      console.log('✅ [ADMIN] Approving tasker:', taskerId);
      await acceptTasker(taskerId);
      setPendingTaskers(prev => prev.filter(tasker => tasker.id !== taskerId));
      toast({
        title: "Tasker Approved",
        description: "The tasker has been successfully approved and can now start bidding on tasks.",
      });
    } catch (error) {
      console.error('❌ [ADMIN] Error approving tasker:', error);
      toast({
        title: "Error",
        description: `Failed to approve tasker: ${error instanceof Error ? error.message : 'Unknown error'}`,
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
        description: `Failed to reject tasker: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    }
  };

  const formatDate = (date: string) => {
    return new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  };

  const getActiveUsersCount = () => {
    return allUsers.filter(user => user.role !== 'admin' && (user.role === 'client' || user.approved)).length;
  };

  const getLastSeenBadge = (lastSignIn?: string) => {
    if (!lastSignIn) {
      return <Badge variant="outline" className="text-gray-500">Never</Badge>;
    }
    
    const lastSignInDate = new Date(lastSignIn);
    const now = new Date();
    const diffInHours = (now.getTime() - lastSignInDate.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return <Badge className="bg-green-100 text-green-700">Online</Badge>;
    } else if (diffInHours < 24) {
      return <Badge className="bg-blue-100 text-blue-700">Today</Badge>;
    } else if (diffInHours < 168) { // 7 days
      return <Badge variant="outline" className="text-orange-600">This week</Badge>;
    } else {
      return <Badge variant="outline" className="text-gray-500">
        {formatDate(lastSignIn)}
      </Badge>;
    }
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
                <span className="text-sm font-medium">{user?.full_name}</span>
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
                  {pendingTaskers.length > 0 && (
                    <Badge className="ml-auto bg-yellow-100 text-yellow-700">
                      {pendingTaskers.length}
                    </Badge>
                  )}
                </Button>
                <Button
                  variant={activeTab === 'users' ? 'default' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setActiveTab('users')}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  All Users
                  <Badge className="ml-auto bg-blue-100 text-blue-700">
                    {allUsers.length}
                  </Badge>
                </Button>
                <Button
                  variant={activeTab === 'transactions' ? 'default' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setActiveTab('transactions')}
                >
                  <DollarSign className="h-4 w-4 mr-2" />
                  Transactions
                  {pendingTransactions.length > 0 && (
                    <Badge className="ml-auto bg-orange-100 text-orange-700">
                      {pendingTransactions.length}
                    </Badge>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Stats Card */}
            <Card className="shadow-lg border-0 mt-6">
              <CardHeader>
                <CardTitle className="text-blue-900 text-lg">Platform Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Pending taskers</span>
                  <Badge className={pendingTaskers.length > 0 ? "bg-yellow-100 text-yellow-700" : "bg-gray-100 text-gray-700"}>
                    {pendingTaskers.length}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Active users</span>
                  <Badge className="bg-green-100 text-green-700">{getActiveUsersCount()}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total users</span>
                  <Badge className="bg-blue-100 text-blue-700">{allUsers.length}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Pending transactions</span>
                  <Badge className={pendingTransactions.length > 0 ? "bg-orange-100 text-orange-700" : "bg-gray-100 text-gray-700"}>
                    {pendingTransactions.length}
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
            )}

            {activeTab === 'users' && (
              <Card className="shadow-lg border-0">
                <CardHeader>
                  <CardTitle className="text-blue-900">All Platform Users</CardTitle>
                  <CardDescription>
                    View and manage all registered users on the platform
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="mt-2 text-gray-600">Loading users...</p>
                    </div>
                  ) : allUsers.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-lg font-medium">No users found</p>
                      <p className="text-sm">No users are registered on the platform yet.</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Last Seen</TableHead>
                          <TableHead>Member Since</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {allUsers.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell className="font-medium">{user.full_name}</TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className={
                                user.role === 'client' ? 'text-blue-700 border-blue-300' : 
                                user.role === 'admin' ? 'text-purple-700 border-purple-300' : 'text-green-700 border-green-300'
                              }>
                                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge className={
                                user.role === 'client' || user.approved 
                                  ? 'bg-green-100 text-green-700' 
                                  : 'bg-yellow-100 text-yellow-700'
                              }>
                                {user.role === 'client' || user.approved ? 'Active' : 'Pending'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {getLastSeenBadge(user.last_sign_in_at)}
                            </TableCell>
                            <TableCell>{formatDate(user.created_at)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            )}

            {activeTab === 'transactions' && (
              <Card className="shadow-lg border-0">
                <CardHeader>
                  <CardTitle className="text-blue-900">Pending Transactions</CardTitle>
                  <CardDescription>
                    Monitor and manage platform transactions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="mt-2 text-gray-600">Loading transactions...</p>
                    </div>
                  ) : pendingTransactions.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <DollarSign className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-lg font-medium">No pending transactions</p>
                      <p className="text-sm">All transactions have been processed.</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Task</TableHead>
                          <TableHead>Client</TableHead>
                          <TableHead>Tasker</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Payment</TableHead>
                          <TableHead>Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pendingTransactions.map((transaction) => (
                          <TableRow key={transaction.id}>
                            <TableCell className="font-medium">{transaction.task?.title || 'N/A'}</TableCell>
                            <TableCell>{transaction.client?.full_name || 'N/A'}</TableCell>
                            <TableCell>{transaction.tasker?.full_name || 'N/A'}</TableCell>
                            <TableCell className="font-medium">£{transaction.amount}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className={
                                transaction.payment_method === 'cash' ? 'text-green-700' : 'text-blue-700'
                              }>
                                {transaction.payment_method === 'cash' ? 'Cash' : 'Transfer'}
                              </Badge>
                            </TableCell>
                            <TableCell>{formatDate(transaction.created_at)}</TableCell>
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
