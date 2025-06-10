
import { supabase } from "@/integrations/supabase/client";

export interface Notification {
  id: string;
  user_id: string;
  type: 'chat_message' | 'new_task' | 'offer_accepted' | 'offer_rejected' | 'task_cancelled';
  title: string;
  message?: string;
  task_id?: string;
  offer_id?: string;
  is_read: boolean;
  created_at: string;
}

export const fetchNotifications = async (userId: string): Promise<Notification[]> => {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Failed to fetch notifications: ${error.message}`);
  return data || [];
};

export const getUnreadNotificationCount = async (userId: string): Promise<number> => {
  const { data, error } = await supabase.rpc('get_unread_notification_count', {
    user_id_param: userId
  });

  if (error) {
    console.error('Error fetching unread count:', error);
    return 0;
  }
  return data || 0;
};

export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId);

  if (error) throw new Error(`Failed to mark notification as read: ${error.message}`);
};

export const markAllNotificationsAsRead = async (userId: string): Promise<void> => {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false);

  if (error) throw new Error(`Failed to mark all notifications as read: ${error.message}`);
};
