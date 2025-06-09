
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

// 🛠️ Admin tools
export {
  fetchAllUsers,
  fetchPendingTaskers,
  fetchPendingTransactions,
  acceptTasker,
  rejectTasker
} from './admin';

// 💬 Chat
export {
  fetchChatRooms,
  fetchMessages,
  sendMessage,
  markMessagesAsRead
} from './chat';
