
interface AnalyticsSummaryCardsProps {
  totalUsers: number;
  totalTasks: number;
  totalAmount: number;
  totalCommission: number;
  isTaskerTable: boolean;
  formatCurrency: (amount: number) => string;
}

export const AnalyticsSummaryCards = ({
  totalUsers,
  totalTasks,
  totalAmount,
  totalCommission,
  isTaskerTable,
  formatCurrency
}: AnalyticsSummaryCardsProps) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div className="bg-blue-50 p-3 rounded-lg">
        <div className="text-lg font-bold text-blue-900">{totalUsers}</div>
        <div className="text-sm text-blue-600">Total {isTaskerTable ? 'Taskers' : 'Clients'}</div>
      </div>
      <div className="bg-green-50 p-3 rounded-lg">
        <div className="text-lg font-bold text-green-900">{totalTasks}</div>
        <div className="text-sm text-green-600">Total Tasks</div>
      </div>
      <div className="bg-purple-50 p-3 rounded-lg">
        <div className="text-lg font-bold text-purple-900">{formatCurrency(totalAmount)}</div>
        <div className="text-sm text-purple-600">Total {isTaskerTable ? 'Earnings' : 'Spent'}</div>
      </div>
      <div className="bg-orange-50 p-3 rounded-lg">
        <div className="text-lg font-bold text-orange-900">{formatCurrency(totalCommission)}</div>
        <div className="text-sm text-orange-600">Total Commission</div>
      </div>
    </div>
  );
};
