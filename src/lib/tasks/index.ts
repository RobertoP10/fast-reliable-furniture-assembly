
// Re-export types
export type { Task, TaskBase, TaskInsert, TaskUpdate, TaskStatus, Offer } from './types';

// Re-export fetch operations
export { fetchTasks, fetchTask } from './fetch';

// Re-export mutation operations
export { 
  createTask, 
  updateTaskStatus, 
  acceptOffer, 
  cancelTask, 
  completeTask 
} from './mutations';
