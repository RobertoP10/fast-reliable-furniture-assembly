
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { fetchNotifications, getUnreadNotificationCount, type Notification } from "@/lib/notifications";

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

  useEffect(() => {
    if (user?.id) {
      loadNotifications();
      
      // Refresh every 30 seconds
      const interval = setInterval(loadNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user?.id]);

  return {
    notifications,
    unreadCount,
    loading,
    refreshNotifications: loadNotifications
  };
};
