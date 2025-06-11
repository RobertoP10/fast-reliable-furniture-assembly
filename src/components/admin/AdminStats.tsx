
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface AdminStatsProps {
  stats: any;
}

export const AdminStats = ({ stats }: AdminStatsProps) => {
  return (
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
  );
};
