
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { fetchNotifications, getUnreadNotificationCount, markAllNotificationsAsRead, type Notification } from "@/lib/notifications";
import { supabase } from "@/integrations/supabase/client";

export const useNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const loadNotifications = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const [notificationsData, unreadCountData] = await Promise.all([
        fetchNotifications(user.id),
        getUnreadNotificationCount(user.id)
      ]);
      
      setNotifications(notificationsData);
      setUnreadCount(unreadCountData);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markNotificationsAsRead = async () => {
    if (!user?.id) return;
    
    try {
      await markAllNotificationsAsRead(user.id);
      setUnreadCount(0);
      // Update local state to mark all as read
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, is_read: true }))
      );
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  };

  useEffect(() => {
    if (user?.id) {
      loadNotifications();
      
      // Set up real-time subscription for new notifications
      const channel = supabase
        .channel('notifications-changes')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`
          },
          () => {
            // Refresh notifications when new ones arrive
            loadNotifications();
          }
        )
        .subscribe();
      
      // Refresh every 30 seconds as fallback
      const interval = setInterval(loadNotifications, 30000);
      
      return () => {
        supabase.removeChannel(channel);
        clearInterval(interval);
      };
    }
  }, [user?.id]);

  return {
    notifications,
    unreadCount,
    loading,
    refreshNotifications: loadNotifications,
    markNotificationsAsRead
  };
};
