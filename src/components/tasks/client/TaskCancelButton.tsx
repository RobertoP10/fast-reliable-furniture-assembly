
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { cancelTask } from "@/lib/tasks";
import { useToast } from "@/hooks/use-toast";

interface TaskCancelButtonProps {
  taskId: string;
  onTaskUpdate?: () => void;
}

export const TaskCancelButton = ({ taskId, onTaskUpdate }: TaskCancelButtonProps) => {
  const { toast } = useToast();

  const handleCancelTask = async () => {
    if (!confirm("Are you sure you want to cancel this task? This action cannot be undone.")) {
      return;
    }

    const result = await cancelTask(taskId, "Cancelled by client");
    if (result.success) {
      toast({ title: "✅ Task cancelled successfully" });
      onTaskUpdate?.();
    } else {
      toast({ 
        title: "❌ Failed to cancel task", 
        description: result.error,
        variant: "destructive" 
      });
    }
  };

  return (
    <Button 
      onClick={handleCancelTask}
      variant="outline"
      className="text-red-600 hover:text-red-700"
    >
      <X className="h-4 w-4 mr-2" />
      Cancel Task
    </Button>
  );
};
