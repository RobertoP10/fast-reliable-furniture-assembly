
// Re-export all admin functions for backward compatibility
export {
  fetchAllUsers,
  fetchPendingTaskers,
  acceptTasker,
  rejectTasker
} from './admin/users';

export {
  fetchPendingTransactions,
  fetchAllTransactions,
  confirmTransaction
} from './admin/transactions';

export {
  fetchAnalyticsData
} from './admin/analytics';

export type {
  User,
  PendingTasker,
  Transaction,
  AnalyticsData,
  TaskerBreakdown,
  ClientBreakdown
} from './admin/types';
