
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "@/hooks/useNotifications";

interface NotificationBadgeProps {
  count?: number;
  onClick?: () => void;
}

export const NotificationBadge = ({ count, onClick }: NotificationBadgeProps) => {
  const navigate = useNavigate();
  const { markNotificationsAsRead } = useNotifications();

  const handleClick = async () => {
    // Mark notifications as read when badge is clicked
    await markNotificationsAsRead();
    
    if (onClick) {
      onClick();
    } else {
      // Default behavior: navigate to appropriate dashboard based on user role
      const userRole = localStorage.getItem('userRole');
      if (userRole === 'client') {
        navigate('/client-dashboard');
      } else if (userRole === 'tasker') {
        navigate('/tasker-dashboard');
      }
    }
  };

  return (
    <Button variant="ghost" size="sm" className="relative" onClick={handleClick}>
      <Bell className="h-4 w-4" />
      {count && count > 0 && (
        <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center p-0">
          {count > 9 ? '9+' : count}
        </Badge>
      )}
    </Button>
  );
};
