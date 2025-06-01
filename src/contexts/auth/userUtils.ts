
import type { User } from './types';

export const transformUserProfile = (userProfile: any, email: string): User => {
  return {
    id: userProfile.id,
    email: userProfile.email || email,
    name: userProfile.name || '',
    role: userProfile.role as 'client' | 'tasker' | 'admin',
    location: userProfile.location || '',
    phone: userProfile.phone || '',
    isApproved: userProfile.approved === 'true',
    rating: 0,
    completedTasks: 0
  };
};
