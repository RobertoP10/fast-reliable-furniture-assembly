import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { 
  fetchPendingTaskers, 
  fetchAllUsers, 
  fetchPendingTransactions, 
  fetchAllTransactions,
  fetchTransactionsByDateRange,
  fetchTransactionsByTasker,
  fetchTransactionsByClient,
  acceptTasker, 
  rejectTasker, 
  confirmTransaction,
  getPlatformAnalytics,
  getAdminStats
} from "@/lib/admin";
import { Wrench, Users, CheckCircle, X, Eye, User, LogOut, RefreshCw, DollarSign, BarChart3, Star, Filter } from "lucide-react";

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'pending-taskers' | 'users' | 'transactions' | 'analytics'>('pending-taskers');
  const [pendingTaskers, setPendingTaskers] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(false);

  // Filter states
  const [dateFilter, setDateFilter] = useState({ start: '', end: '' });
  const [selectedTasker, setSelectedTasker] = useState('');
  const [selectedClient, setSelectedClient] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Get unique taskers and clients for filter dropdowns
  const [taskers, setTaskers] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);

  // Load filter options
  const loadFilterOptions = async () => {
    try {
      const users = await fetchAllUsers();
      const taskerUsers = users.filter(u => u.role === 'tasker' && u.approved);
      const clientUsers = users.filter(u => u.role === 'client');
      setTaskers(taskerUsers);
      setClients(clientUsers);
    } catch (error) {
      console.error('Error loading filter options:', error);
    }
  };

  // Load data based on active tab
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
        let transactionData;
        if (dateFilter.start && dateFilter.end) {
          transactionData = await fetchTransactionsByDateRange(dateFilter.start, dateFilter.end);
        } else if (selectedTasker) {
          transactionData = await fetchTransactionsByTasker(selectedTasker);
        } else if (selectedClient) {
          transactionData = await fetchTransactionsByClient(selectedClient);
        } else {
          transactionData = await fetchAllTransactions();
        }
        setTransactions(transactionData);
        console.log('✅ [ADMIN] Loaded transactions:', transactionData.length);
      } else if (activeTab === 'analytics') {
        const analyticsData = await getPlatformAnalytics();
        setAnalytics(analyticsData);
        console.log('✅ [ADMIN] Loaded analytics:', analyticsData);
      }

      // Always load stats
      const statsData = await getAdminStats();
      setStats(statsData);
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

  useEffect(() => {
    loadData();
    if (activeTab === 'transactions') {
      loadFilterOptions();
    }
  }, [activeTab, dateFilter, selectedTasker, selectedClient, toast]);

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

  const handleConfirmTransaction = async (transactionId: string) => {
    try {
      console.log('✅ [ADMIN] Confirming transaction:', transactionId);
      await confirmTransaction(transactionId);
      setTransactions(prev => prev.filter(transaction => transaction.id !== transactionId));
      toast({
        title: "Transaction Confirmed",
        description: "The transaction has been confirmed and processed.",
      });
    } catch (error) {
      console.error('❌ [ADMIN] Error confirming transaction:', error);
      toast({
        title: "Error",
        description: `Failed to confirm transaction: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    }
  };

  const clearFilters = () => {
    setDateFilter({ start: '', end: '' });
    setSelectedTasker('');
    setSelectedClient('');
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

  const formatCurrency = (amount: number) => {
    return `£${amount.toFixed(2)}`;
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
                <CardTitle className="text-blue-900 flex items-center justify-between">
                  Admin Panel
                  <Button variant="ghost" size="sm" onClick={loadData} disabled={loading}>
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  </Button>
                </CardTitle>
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
                  {stats.pendingTaskers > 0 && (
                    <Badge className="ml-auto bg-yellow-100 text-yellow-700">
                      {stats.pendingTaskers}
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
                    {stats.totalUsers || 0}
                  </Badge>
                </Button>
                <Button
                  variant={activeTab === 'transactions' ? 'default' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setActiveTab('transactions')}
                >
                  <DollarSign className="h-4 w-4 mr-2" />
                  Transactions
                  {stats.pendingTransactions > 0 && (
                    <Badge className="ml-auto bg-orange-100 text-orange-700">
                      {stats.pendingTransactions}
                    </Badge>
                  )}
                </Button>
                <Button
                  variant={activeTab === 'analytics' ? 'default' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setActiveTab('analytics')}
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Analytics
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
                  <Badge className={stats.pendingTaskers > 0 ? "bg-yellow-100 text-yellow-700" : "bg-gray-100 text-gray-700"}>
                    {stats.pendingTaskers || 0}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Active users</span>
                  <Badge className="bg-green-100 text-green-700">{stats.activeUsers || 0}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total users</span>
                  <Badge className="bg-blue-100 text-blue-700">{stats.totalUsers || 0}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Pending transactions</span>
                  <Badge className={stats.pendingTransactions > 0 ? "bg-orange-100 text-orange-700" : "bg-gray-100 text-gray-700"}>
                    {stats.pendingTransactions || 0}
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
                          <TableHead>Rating</TableHead>
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
                              <div className="flex items-center space-x-1">
                                <Star className="h-4 w-4 text-yellow-500 fill-current" />
                                <span className="text-sm">{Number(user.rating || 0).toFixed(1)}</span>
                                <span className="text-xs text-gray-500">({user.total_reviews || 0})</span>
                              </div>
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
                  <CardTitle className="text-blue-900 flex items-center justify-between">
                    Platform Transactions
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowFilters(!showFilters)}
                    >
                      <Filter className="h-4 w-4 mr-2" />
                      Filters
                    </Button>
                  </CardTitle>
                  <CardDescription>
                    Monitor and manage platform transactions
                  </CardDescription>
                  
                  {showFilters && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 p-4 bg-gray-50 rounded-lg">
                      <div>
                        <label className="block text-sm font-medium mb-2">Start Date</label>
                        <Input
                          type="date"
                          value={dateFilter.start}
                          onChange={(e) => setDateFilter(prev => ({ ...prev, start: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">End Date</label>
                        <Input
                          type="date"
                          value={dateFilter.end}
                          onChange={(e) => setDateFilter(prev => ({ ...prev, end: e.target.value }))}
                        />
                      </div>
                      <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                        <div>
                          <label className="block text-sm font-medium mb-2">Filter by Tasker</label>
                          <Select value={selectedTasker} onValueChange={setSelectedTasker}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a tasker" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">All Taskers</SelectItem>
                              {taskers.map(tasker => (
                                <SelectItem key={tasker.id} value={tasker.id}>{tasker.full_name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">Filter by Client</label>
                          <Select value={selectedClient} onValueChange={setSelectedClient}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a client" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">All Clients</SelectItem>
                              {clients.map(client => (
                                <SelectItem key={client.id} value={client.id}>{client.full_name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-end">
                          <Button variant="outline" onClick={clearFilters}>
                            Clear Filters
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="mt-2 text-gray-600">Loading transactions...</p>
                    </div>
                  ) : transactions.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <DollarSign className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-lg font-medium">No transactions found</p>
                      <p className="text-sm">No transactions match your current filters.</p>
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
                          <TableHead>Status</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {transactions.map((transaction) => (
                          <TableRow key={transaction.id}>
                            <TableCell className="font-medium">
                              {transaction.task_requests?.title || 'Unknown Task'}
                            </TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium">{transaction.client?.full_name || 'Unknown Client'}</div>
                                <div className="text-sm text-gray-500">{transaction.client?.email || 'No email'}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium">{transaction.tasker?.full_name || 'Unknown Tasker'}</div>
                                <div className="text-sm text-gray-500">{transaction.tasker?.email || 'No email'}</div>
                              </div>
                            </TableCell>
                            <TableCell className="font-medium">{formatCurrency(Number(transaction.amount))}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className={
                                transaction.payment_method === 'cash' ? 'text-green-700' : 'text-blue-700'
                              }>
                                {transaction.payment_method === 'cash' ? 'Cash' : 'Transfer'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge className={
                                transaction.status === 'confirmed' ? 'bg-green-100 text-green-700' : 
                                transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'
                              }>
                                {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                              </Badge>
                            </TableCell>
                            <TableCell>{formatDate(transaction.created_at)}</TableCell>
                            <TableCell>
                              {transaction.status === 'pending' && (
                                <Button
                                  size="sm"
                                  onClick={() => handleConfirmTransaction(transaction.id)}
                                  className="bg-green-600 hover:bg-green-700"
                                  title="Confirm transaction"
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
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

            {activeTab === 'analytics' && (
              <div className="space-y-6">
                <Card className="shadow-lg border-0">
                  <CardHeader>
                    <CardTitle className="text-blue-900">Platform Analytics</CardTitle>
                    <CardDescription>
                      Overview of platform performance and metrics
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-2 text-gray-600">Loading analytics...</p>
                      </div>
                    ) : analytics ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <div className="text-2xl font-bold text-blue-900">{analytics.totalCompletedTasks}</div>
                          <div className="text-sm text-blue-600">Completed Tasks</div>
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg">
                          <div className="text-2xl font-bold text-green-900">{formatCurrency(analytics.totalValue)}</div>
                          <div className="text-sm text-green-600">Total Value</div>
                        </div>
                        <div className="bg-purple-50 p-4 rounded-lg">
                          <div className="text-2xl font-bold text-purple-900">{formatCurrency(analytics.platformCommission)}</div>
                          <div className="text-sm text-purple-600">Platform Commission (20%)</div>
                        </div>
                        <div className="bg-yellow-50 p-4 rounded-lg">
                          <div className="text-2xl font-bold text-yellow-900 flex items-center">
                            <Star className="h-5 w-5 mr-1 fill-current" />
                            {analytics.averageRating.toFixed(1)}
                          </div>
                          <div className="text-sm text-yellow-600">Average Rating</div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p className="text-lg font-medium">No analytics data</p>
                        <p className="text-sm">Analytics will appear as transactions are processed.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {analytics && analytics.taskerBreakdown.length > 0 && (
                  <Card className="shadow-lg border-0">
                    <CardHeader>
                      <CardTitle className="text-blue-900">Top Taskers</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Tasker</TableHead>
                            <TableHead>Completed Tasks</TableHead>
                            <TableHead>Total Earnings</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {analytics.taskerBreakdown.slice(0, 10).map((tasker: any, index: number) => (
                            <TableRow key={index}>
                              <TableCell className="font-medium">{tasker.name}</TableCell>
                              <TableCell>{tasker.taskCount}</TableCell>
                              <TableCell>{formatCurrency(tasker.totalEarnings)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                )}

                {analytics && analytics.clientBreakdown.length > 0 && (
                  <Card className="shadow-lg border-0">
                    <CardHeader>
                      <CardTitle className="text-blue-900">Top Clients</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Client</TableHead>
                            <TableHead>Tasks Posted</TableHead>
                            <TableHead>Total Spent</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {analytics.clientBreakdown.slice(0, 10).map((client: any, index: number) => (
                            <TableRow key={index}>
                              <TableCell className="font-medium">{client.name}</TableCell>
                              <TableCell>{client.taskCount}</TableCell>
                              <TableCell>{formatCurrency(client.totalSpent)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
