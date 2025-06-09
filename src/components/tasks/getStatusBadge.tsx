
import { Badge } from "@/components/ui/badge";

export const getStatusBadge = (status: string) => {
  const map: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700",
    accepted: "bg-blue-100 text-blue-700",
    in_progress: "bg-purple-100 text-purple-700",
    completed: "bg-green-100 text-green-700",
    cancelled: "bg-gray-100 text-gray-700",
  };
  return <Badge className={map[status] || "bg-gray-100 text-gray-700"}>{status}</Badge>;
};
