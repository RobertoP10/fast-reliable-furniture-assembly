
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { Wrench, Clock, User, LogOut } from "lucide-react";

const TaskerPending = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
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
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium">{user?.name}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={logout}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex items-center justify-center min-h-[calc(100vh-80px)] px-4">
        <Card className="w-full max-w-md shadow-xl border-0">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center mb-4">
              <Clock className="h-16 w-16 text-yellow-500" />
            </div>
            <CardTitle className="text-2xl text-blue-900">Account Pending Approval</CardTitle>
            <CardDescription className="text-lg">
              Your tasker account is currently under review
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-semibold text-yellow-800 mb-2">What happens next?</h3>
              <ul className="text-sm text-yellow-700 space-y-2 text-left">
                <li>• Our admin team will review your application</li>
                <li>• This process typically takes 24-48 hours</li>
                <li>• You'll receive an email notification once approved</li>
                <li>• After approval, you can start bidding on tasks</li>
              </ul>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-800 mb-2">Why do we review taskers?</h3>
              <p className="text-sm text-blue-700 text-left">
                We manually verify all taskers to ensure quality service and maintain trust 
                between clients and service providers on our platform.
              </p>
            </div>

            <div className="pt-4 space-y-3">
              <Button onClick={logout} variant="outline" className="w-full">
                Sign Out
              </Button>
              <p className="text-xs text-gray-500">
                You can log back in at any time to check your approval status
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TaskerPending;
