
interface CompletedTasksStatsProps {
  completedCount: number;
  completedTotal: number;
}

export const CompletedTasksStats = ({ completedCount, completedTotal }: CompletedTasksStatsProps) => {
  return (
    <div className="flex justify-between text-sm text-gray-600">
      <span>Total tasks: <strong>{completedCount}</strong></span>
      <span>Total value: <strong>£{completedTotal.toFixed(2)}</strong></span>
    </div>
  );
};
