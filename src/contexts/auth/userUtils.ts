
import type { User } from './types';

export const transformUserProfile = (userProfile: any, email: string): User => {
  return {
    id: userProfile.id,
    email: email,
    name: userProfile.name || '',
    role: userProfile.role || 'client',
    location: userProfile.location || '',
    phone: userProfile.phone || '',
    isApproved: userProfile.approved === 'true' || userProfile.approved === true,
    rating: userProfile.rating || null,
    completedTasks: userProfile.completed_tasks || 0
  };
};
