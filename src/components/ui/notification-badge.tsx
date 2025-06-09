
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface NotificationBadgeProps {
  count?: number;
  onClick?: () => void;
}

export const NotificationBadge = ({ count = 0, onClick }: NotificationBadgeProps) => {
  return (
    <Button variant="ghost" size="sm" className="relative" onClick={onClick}>
      <Bell className="h-4 w-4" />
      {count > 0 && (
        <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center p-0">
          {count > 9 ? '9+' : count}
        </Badge>
      )}
    </Button>
  );
};
