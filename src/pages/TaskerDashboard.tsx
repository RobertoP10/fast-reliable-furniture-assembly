
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { Wrench, Bell, User, LogOut, Star, DollarSign, CheckCircle } from "lucide-react";
import TasksList from "@/components/tasks/TasksList";
import Chat from "@/components/chat/Chat";
import RoleProtection from "@/components/auth/RoleProtection";

import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { createOffer } from "@/lib/offers";

const TaskerDashboard = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'available' | 'my-tasks' | 'chat'>('available');

  const [openOfferDialog, setOpenOfferDialog] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [offerPrice, setOfferPrice] = useState('');
  const [offerMessage, setOfferMessage] = useState('');
  const [availabilityDate, setAvailabilityDate] = useState('');

  if (!user?.approved) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center px-4">
        <Card className="w-full max-w-md shadow-xl border-0">
          <CardHeader className="text-center">
            <Wrench className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <CardTitle className="text-blue-900">Account Pending Approval</CardTitle>
            <CardDescription>
              Your tasker account is under review. You will receive a notification when it's approved.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={logout} variant="outline" className="w-full">
              Logout
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <RoleProtection allowedRoles={['tasker']}>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <header className="bg-white/80 backdrop-blur-md border-b border-blue-100 sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <Wrench className="h-8 w-8 text-blue-600" />
                <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  MGSDEAL
                </span>
              </div>
              <div className="flex items-center space-x-4">
                <Button variant="ghost" size="sm" className="relative">
                  <Bell className="h-4 w-4" />
                  <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full"></span>
                </Button>
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-gray-600" />
                  <span className="text-sm font-medium">{user?.full_name}</span>
                  <Badge className="bg-green-100 text-green-700">Tasker</Badge>
                </div>
                <Button variant="ghost" size="sm" onClick={logout}>
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-8">
          <div className="grid lg:grid-cols-4 gap-8">
            <div className="lg:col-span-1">
              <Card className="shadow-lg border-0">
                <CardHeader>
                  <CardTitle className="text-blue-900">Tasker Dashboard</CardTitle>
                  <CardDescription>Welcome, {user?.full_name}!</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    variant={activeTab === 'available' ? 'default' : 'ghost'}
                    className="w-full justify-start"
                    onClick={() => setActiveTab('available')}
                  >
                    Available Tasks
                  </Button>
                  <Button
                    variant={activeTab === 'my-tasks' ? 'default' : 'ghost'}
                    className="w-full justify-start"
                    onClick={() => setActiveTab('my-tasks')}
                  >
                    My Tasks
                  </Button>
                  <Button
                    variant={activeTab === 'chat' ? 'default' : 'ghost'}
                    className="w-full justify-start"
                    onClick={() => setActiveTab('chat')}
                  >
                    Chat
                  </Button>
                </CardContent>
              </Card>

              <Card className="shadow-lg border-0 mt-6">
                <CardHeader>
                  <CardTitle className="text-blue-900 text-lg">My Profile</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Rating</span>
                    <div className="flex items-center space-x-1">
                      <Star className="h-4 w-4 text-yellow-500 fill-current" />
                      <span className="text-sm font-medium">0</span>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total reviews</span>
                    <Badge className="bg-green-100 text-green-700">0</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">This month earnings</span>
                    <div className="flex items-center space-x-1">
                      <DollarSign className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium">£0</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Status</span>
                    <div className="flex items-center space-x-1">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-600">
                        {user?.approved ? 'Verified' : 'Pending'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-3">
              {activeTab === 'available' && <TasksList userRole="tasker" onMakeOffer={(taskId) => {
                setSelectedTaskId(taskId);
                setOpenOfferDialog(true);
              }} />}
              {activeTab === 'my-tasks' && <TasksList userRole="tasker" />}
              {activeTab === 'chat' && <Chat />}
            </div>
          </div>
        </div>
      </div>

      <Dialog open={openOfferDialog} onOpenChange={setOpenOfferDialog}>
        <DialogContent>
          <DialogHeader>
            <h2 className="text-lg font-semibold">Make an Offer</h2>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Price (£)</Label>
              <Input type="number" value={offerPrice} onChange={(e) => setOfferPrice(e.target.value)} />
            </div>
            <div>
              <Label>Message to Client</Label>
              <Textarea value={offerMessage} onChange={(e) => setOfferMessage(e.target.value)} />
            </div>
            <div>
              <Label>Available Date & Time</Label>
              <Input type="datetime-local" value={availabilityDate} onChange={(e) => setAvailabilityDate(e.target.value)} />
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button onClick={async () => {
              if (!selectedTaskId || !user) return;
              await createOffer({
                task_id: selectedTaskId,
                tasker_id: user.id,
                price: parseFloat(offerPrice),
                message: `${offerMessage}
Availability: ${availabilityDate}`,
              });
              setOpenOfferDialog(false);
              setOfferPrice('');
              setOfferMessage('');
              setAvailabilityDate('');
            }}>
              Send Offer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </RoleProtection>
  );
};

export default TaskerDashboard;
