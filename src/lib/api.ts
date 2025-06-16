
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

// 🛠️ Admin tools - Import from the modular admin structure
export {
  fetchAllUsers,
  fetchPendingTaskers,
  fetchPendingTransactions,
  fetchAllTransactions,
  fetchAnalyticsData,
  acceptTasker,
  rejectTasker,
  confirmTransaction
} from './admin/index';

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
