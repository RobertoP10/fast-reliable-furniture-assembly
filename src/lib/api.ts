// src/lib/api.ts

// AUTH
export { validateUserSession } from "./auth";

// TASKS
export { fetchTasks, createTask, updateTaskStatus } from "./tasks";

// OFFERS
export { fetchOffers, fetchUserOffers, createOffer, acceptOffer } from "./offers";

// ADMIN (verifică să existe aceste funcții în admin.ts)
export {
  fetchAllUsers,
  fetchPendingTaskers,
  fetchPendingTransactions,
  acceptTasker,
  rejectTasker
} from "./admin";

// CHAT (verifică să existe aceste funcții în chat.ts)
export {
  fetchChatRooms,
  fetchMessages,
  sendMessage,
  markMessagesAsRead
} from "./chat";
