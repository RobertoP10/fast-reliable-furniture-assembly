
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EnhancedAnalyticsTable } from "@/components/admin/EnhancedAnalyticsTable";
import { BarChart3, Star } from "lucide-react";

interface AnalyticsTabProps {
  analytics: any;
  loading: boolean;
  formatCurrency: (amount: number) => string;
}

export const AnalyticsTab = ({ analytics, loading, formatCurrency }: AnalyticsTabProps) => {
  const formatDate = (date: string) => {
    return new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }).format(new Date(date));
  };

  return (
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
        <EnhancedAnalyticsTable
          title="Top Taskers"
          data={analytics.taskerBreakdown}
          formatCurrency={formatCurrency}
          formatDate={formatDate}
          isTaskerTable={true}
        />
      )}

      {analytics && analytics.clientBreakdown.length > 0 && (
        <EnhancedAnalyticsTable
          title="Top Clients"
          data={analytics.clientBreakdown}
          formatCurrency={formatCurrency}
          formatDate={formatDate}
          isTaskerTable={false}
        />
      )}
    </div>
  );
};
