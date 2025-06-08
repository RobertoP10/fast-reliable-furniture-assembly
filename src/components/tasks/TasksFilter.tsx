
import { Button } from "@/components/ui/button";

interface TasksFilterProps {
  activeTab: "available" | "my-tasks" | "completed" | "received-offers";
  userRole: "client" | "tasker";
  onTabChange: (tab: "available" | "my-tasks" | "completed" | "received-offers") => void;
}

const TasksFilter = ({ activeTab, userRole, onTabChange }: TasksFilterProps) => {
  return (
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
  );
};

export default TasksFilter;
