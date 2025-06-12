
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Eye, Clock, DollarSign, BarChart3, RefreshCw, MapPin } from "lucide-react";

type ActiveTab = 'pending-taskers' | 'pending-clients' | 'users' | 'pending-transactions' | 'transactions' | 'analytics';

interface AdminSidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  stats: any;
  loading: boolean;
  onRefresh: () => void;
}

export const AdminSidebar = ({ activeTab, setActiveTab, stats, loading, onRefresh }: AdminSidebarProps) => {
  return (
    <div className="lg:col-span-1">
      <Card className="shadow-lg border-0">
        <CardHeader>
          <CardTitle className="text-blue-900 flex items-center justify-between">
            Admin Panel
            <Button variant="ghost" size="sm" onClick={onRefresh} disabled={loading}>
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
            variant={activeTab === 'pending-clients' ? 'default' : 'ghost'}
            className="w-full justify-start"
            onClick={() => setActiveTab('pending-clients')}
          >
            <MapPin className="h-4 w-4 mr-2" />
            Pending Clients
            {stats.pendingClients > 0 && (
              <Badge className="ml-auto bg-orange-100 text-orange-700">
                {stats.pendingClients}
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
            variant={activeTab === 'pending-transactions' ? 'default' : 'ghost'}
            className="w-full justify-start"
            onClick={() => setActiveTab('pending-transactions')}
          >
            <Clock className="h-4 w-4 mr-2" />
            Pending Transactions
            {stats.pendingTransactions > 0 && (
              <Badge className="ml-auto bg-orange-100 text-orange-700">
                {stats.pendingTransactions}
              </Badge>
            )}
          </Button>
          <Button
            variant={activeTab === 'transactions' ? 'default' : 'ghost'}
            className="w-full justify-start"
            onClick={() => setActiveTab('transactions')}
          >
            <DollarSign className="h-4 w-4 mr-2" />
            All Transactions
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
    </div>
  );
};
