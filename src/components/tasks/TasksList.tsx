
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { fetchTasks, acceptOffer } from "@/lib/api";
import MakeOfferDialog from "@/components/tasks/MakeOfferDialog";
import TaskCard from "@/components/tasks/TaskCard";
import TasksFilter from "@/components/tasks/TasksFilter";
import TasksStats from "@/components/tasks/TasksStats";
import type { Task } from "@/lib/tasks";

interface TasksListProps {
  userRole: "client" | "tasker";
  tasks?: Task[];
}

const TasksList = ({ userRole, tasks: propTasks }: TasksListProps) => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"available" | "my-tasks" | "completed" | "received-offers">("available");
  const [completedCount, setCompletedCount] = useState(0);
  const [completedTotal, setCompletedTotal] = useState(0);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const loadData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const fetchedTasks = await fetchTasks(user.id, userRole);
      console.log("🔍 [TASKS] Fetched tasks:", fetchedTasks);
      let filteredTasks = fetchedTasks;

      if (userRole === "tasker") {
        if (activeTab === "available") {
          filteredTasks = fetchedTasks.filter(task =>
            task.status === "pending" &&
            !(task.offers && task.offers.some((offer) => offer.tasker_id === user.id))
          );
        } else if (activeTab === "my-tasks") {
          filteredTasks = fetchedTasks.filter(task =>
            task.offers?.some((offer) => offer.tasker_id === user.id)
          );
        } else if (activeTab === "completed") {
          filteredTasks = fetchedTasks.filter(task => task.status === "completed");
        }
      } else if (userRole === "client") {
        if (activeTab === "available") {
          filteredTasks = fetchedTasks.filter(task => task.status === "pending");
        } else if (activeTab === "my-tasks") {
          filteredTasks = fetchedTasks.filter(task => task.status === "accepted");
        } else if (activeTab === "completed") {
          filteredTasks = fetchedTasks.filter(task => task.status === "completed");
        } else if (activeTab === "received-offers") {
          filteredTasks = fetchedTasks.filter(task =>
            task.status === "pending" &&
            task.offers && task.offers.length > 0
          );
          console.log("🔍 [TASKS] Filtered tasks for received-offers:", filteredTasks);
        }
      }

      if (activeTab === "completed") {
        const total = filteredTasks.reduce((sum, task) => {
          const accepted = task.offers?.find(o => o.is_accepted);
          return sum + (accepted?.price ?? 0);
        }, 0);
        setCompletedCount(filteredTasks.length);
        setCompletedTotal(total);
      }

      setTasks(filteredTasks);
    } catch (error) {
      console.error("❌ Error loading tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!propTasks) {
      loadData();
    } else {
      setTasks(propTasks);
      setLoading(false);
    }
  }, [user, activeTab]);

  const handleOfferCreated = () => {
    setSelectedTaskId(null);
    loadData();
  };

  const handleAcceptOffer = async (taskId: string, offerId: string) => {
    const res = await acceptOffer(taskId, offerId);
    if (res.success) {
      loadData();
    } else {
      console.error("❌ Failed to accept offer:", res.error);
    }
  };

  const getPageTitle = () => {
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-blue-900">
          {getPageTitle()}
        </h2>
        <TasksFilter 
          activeTab={activeTab}
          userRole={userRole}
          onTabChange={setActiveTab}
        />
      </div>

      {activeTab === "completed" && (
        <TasksStats 
          completedCount={completedCount}
          completedTotal={completedTotal}
        />
      )}

      {loading ? (
        <Card><CardContent className="text-center py-8">Loading...</CardContent></Card>
      ) : tasks.length === 0 ? (
        <Card><CardContent className="text-center py-8">No tasks found.</CardContent></Card>
      ) : (
        <div className="grid gap-6">
          {tasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              userRole={userRole}
              user={user}
              onAccept={handleAcceptOffer}
              onMakeOffer={() => setSelectedTaskId(task.id)}
            />
          ))}
        </div>
      )}

      {selectedTaskId && (
        <MakeOfferDialog
          taskId={selectedTaskId}
          onOfferCreated={handleOfferCreated}
        />
      )}
    </div>
  );
};

export default TasksList;
