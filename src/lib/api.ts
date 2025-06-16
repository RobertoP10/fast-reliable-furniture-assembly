
// Re-export all API functions from their respective modules

// 🔐 Auth
export {
  validateUserSession
} from './auth';

// 📦 Tasks
export {
  fetchTasks,
  createTask,
  updateTaskStatus,
  acceptOffer,
  cancelTask,
  completeTask
} from './tasks';

// 💼 Offers
export {
  fetchOffers,
  createOffer,
  declineOffer
} from './offers';

// 🛠️ Admin tools - import from the new admin modules
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

// 💬 Chat
export {
  fetchChatRooms,
  fetchMessages,
  sendMessage,
  markMessagesAsRead
} from './chat';

// 🔔 Notifications
export {
  fetchNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead
} from './notifications';
