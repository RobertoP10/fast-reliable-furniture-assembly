
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuthContext } from "@/contexts/AuthContext";
import { Wrench, Users, Eye, User, LogOut } from "lucide-react";
import AdminPendingTaskers from "@/components/dashboard/AdminPendingTaskers";

const AdminDashboard = () => {
  const { user, logout } = useAuthContext();
  const [activeTab, setActiveTab] = useState<'pending-taskers' | 'users' | 'transactions'>('pending-taskers');

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
                  <Badge className="bg-yellow-100 text-yellow-700">2</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Active users</span>
                  <Badge className="bg-green-100 text-green-700">248</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total tasks</span>
                  <Badge className="bg-blue-100 text-blue-700">156</Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {activeTab === 'pending-taskers' && <AdminPendingTaskers />}
            
            {activeTab === 'users' && (
              <Card className="shadow-lg border-0">
                <CardHeader>
                  <CardTitle className="text-blue-900">All Users</CardTitle>
                  <CardDescription>
                    View and manage platform users
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <p className="text-gray-600">User management coming soon.</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === 'transactions' && (
              <Card className="shadow-lg border-0">
                <CardHeader>
                  <CardTitle className="text-blue-900">Transactions</CardTitle>
                  <CardDescription>
                    Manage and monitor transactions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <p className="text-gray-600">Transaction management coming soon.</p>
                  </div>
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
