
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, PoundSterling } from "lucide-react";
import { acceptOffer } from "@/lib/api";
import type { Task } from "@/lib/tasks";

interface TaskCardProps {
  task: Task;
  userRole: "client" | "tasker";
  user: any;
  onAccept: (taskId: string, offerId: string) => void;
  onMakeOffer: () => void;
}

const TaskCard = ({ task, userRole, user, onAccept, onMakeOffer }: TaskCardProps) => {
  const myOffer = task.offers?.find((offer) => offer.tasker_id === user.id);
  const hasOffered = !!myOffer;

  return (
    <Card className="shadow-lg border-0 hover:shadow-xl transition-all duration-300">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-blue-900 mb-2">{task.title}</CardTitle>
            <CardDescription>{task.description}</CardDescription>
          </div>
          {getStatusBadge(task.status)}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-3 gap-4 mb-4 text-sm text-gray-600">
          <div className="flex items-center space-x-2">
            <PoundSterling className="h-4 w-4" />
            <span>£{task.price_range_min} – £{task.price_range_max}</span>
          </div>
          <div className="flex items-center space-x-2">
            <MapPin className="h-4 w-4" />
            <span>{task.location}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4" />
            <span>{new Date(task.created_at).toLocaleString()}</span>
          </div>
        </div>

        {userRole === "tasker" && (
          <>
            {hasOffered ? (
              <Badge>You already sent an offer</Badge>
            ) : (
              <Button onClick={onMakeOffer}>Make an Offer</Button>
            )}
          </>
        )}

        {userRole === "tasker" && myOffer && (
          <div className="text-sm text-gray-700 mt-2">
            Your Offer: <strong>£{myOffer.price}</strong> – Status: <strong>
              {myOffer.is_accepted === true
                ? "Accepted"
                : myOffer.is_accepted === false
                ? "Rejected"
                : "Pending"}
            </strong>
          </div>
        )}

        {userRole === "client" && task.offers && task.offers.length > 0 && (
          <div className="mt-4 space-y-2">
            <h4 className="font-semibold">Received Offers:</h4>
            {task.offers.map((offer) => (
              <div key={offer.id} className="border p-3 rounded shadow-sm">
                <p><strong>Tasker:</strong> {offer.tasker?.full_name ?? offer.tasker_id}</p>
                <p><strong>Price:</strong> £{offer.price}</p>
                {offer.message && <p><strong>Message:</strong> {offer.message}</p>}
                <p><strong>Date:</strong> {offer.proposed_date} at {offer.proposed_time}</p>
                <p><strong>Status:</strong> {offer.is_accepted ? "✅ Accepted" : "Pending"}</p>
                {!offer.is_accepted && (
                  <Button
                    className="mt-2"
                    onClick={() => onAccept(task.id, offer.id)}
                  >
                    Accept Offer
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

function getStatusBadge(status: string) {
  const map: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700",
    accepted: "bg-blue-100 text-blue-700",
    in_progress: "bg-purple-100 text-purple-700",
    completed: "bg-green-100 text-green-700",
    cancelled: "bg-gray-100 text-gray-700",
  };
  return <Badge className={map[status] || "bg-gray-100 text-gray-700"}>{status}</Badge>;
}

export default TaskCard;
