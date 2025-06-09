
import { Button } from "@/components/ui/button";

interface TaskFiltersProps {
  activeTab: "available" | "my-tasks" | "completed" | "received-offers";
  userRole: "client" | "tasker";
  onTabChange: (tab: "available" | "my-tasks" | "completed" | "received-offers") => void;
}

export const TaskFilters = ({ activeTab, userRole, onTabChange }: TaskFiltersProps) => {
  const getTabTitle = () => {
    switch (activeTab) {
      case "completed":
        return "Completed Tasks";
      case "my-tasks":
        return userRole === "client" ? "Accepted Tasks" : "My Offers";
      case "received-offers":
        return "Received Offers";
      default:
        return userRole === "client" ? "Pending Requests" : "Available Tasks";
    }
  };

  return (
    <div className="flex justify-between items-center">
      <h2 className="text-2xl font-bold text-blue-900">
        {getTabTitle()}
      </h2>
      <div className="space-x-2">
        <Button 
          variant={activeTab === "available" ? "default" : "outline"} 
          onClick={() => onTabChange("available")}
        >
          {userRole === "client" ? "Pending Requests" : "Available"}
        </Button>
        <Button 
          variant={activeTab === "my-tasks" ? "default" : "outline"} 
          onClick={() => onTabChange("my-tasks")}
        >
          {userRole === "client" ? "Accepted Tasks" : "My Offers"}
        </Button>
        <Button 
          variant={activeTab === "completed" ? "default" : "outline"} 
          onClick={() => onTabChange("completed")}
        >
          Completed
        </Button>
        {userRole === "client" && (
          <Button 
            variant={activeTab === "received-offers" ? "default" : "outline"} 
            onClick={() => onTabChange("received-offers")}
          >
            Received Offers
          </Button>
        )}
      </div>
    </div>
  );
};
