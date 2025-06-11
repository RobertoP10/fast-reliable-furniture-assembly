
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, PoundSterling, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface DashboardStatsProps {
  userRole: "client" | "tasker";
}

export const DashboardStats = ({ userRole }: DashboardStatsProps) => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    activeTasks: 0,
    completedTasks: 0,
    rating: 0,
    totalReviews: 0,
    monthlyEarnings: 0
  });

  const fetchStats = async () => {
    if (!user?.id) return;

    try {
      // Fetch user profile for rating and reviews
      const { data: profile } = await supabase
        .from('users')
        .select('rating, total_reviews')
        .eq('id', user.id)
        .single();

      let activeTasks = 0;
      let completedTasks = 0;
      let monthlyEarnings = 0;

      if (userRole === "client") {
        // For clients: count their own tasks
        const { data: clientTasks } = await supabase
          .from('task_requests')
          .select('status')
          .eq('client_id', user.id);

        if (clientTasks) {
          activeTasks = clientTasks.filter(task => 
            task.status === 'pending' || task.status === 'accepted'
          ).length;
          completedTasks = clientTasks.filter(task => 
            task.status === 'completed'
          ).length;
        }
      } else {
        // For taskers: count tasks where they have accepted offers
        const { data: taskerTasks } = await supabase
          .from('task_requests')
          .select(`
            status,
            accepted_offer_id,
            completed_at,
            offers!inner(tasker_id, price)
          `)
          .eq('offers.tasker_id', user.id);

        if (taskerTasks) {
          activeTasks = taskerTasks.filter(task => 
            task.accepted_offer_id && 
            task.offers.some(offer => offer.tasker_id === user.id) &&
            (task.status === 'accepted')
          ).length;
          
          completedTasks = taskerTasks.filter(task => 
            task.accepted_offer_id && 
            task.offers.some(offer => offer.tasker_id === user.id) &&
            task.status === 'completed'
          ).length;

          // Calculate monthly earnings
          const currentMonth = new Date().getMonth();
          const currentYear = new Date().getFullYear();
          
          monthlyEarnings = taskerTasks
            .filter(task => 
              task.status === 'completed' &&
              task.completed_at &&
              task.accepted_offer_id &&
              task.offers.some(offer => offer.tasker_id === user.id) &&
              new Date(task.completed_at).getMonth() === currentMonth &&
              new Date(task.completed_at).getFullYear() === currentYear
            )
            .reduce((total, task) => {
              const acceptedOffer = task.offers.find(offer => offer.tasker_id === user.id);
              return total + (Number(acceptedOffer?.price) || 0);
            }, 0);
        }
      }

      setStats({
        activeTasks,
        completedTasks,
        rating: profile?.rating || 0,
        totalReviews: profile?.total_reviews || 0,
        monthlyEarnings
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [user?.id, userRole]);

  // Refresh stats when component receives focus or when tasks update
  useEffect(() => {
    const handleFocus = () => fetchStats();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  return (
    <Card className="shadow-lg border-0">
      <CardHeader>
        <CardTitle className="text-blue-900 text-lg">
          {userRole === "client" ? "Statistics" : "My Profile"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between">
          <span className="text-sm text-gray-600">Active tasks</span>
          <Badge className="bg-blue-100 text-blue-700">{stats.activeTasks}</Badge>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-gray-600">Completed tasks</span>
          <Badge className="bg-green-100 text-green-700">{stats.completedTasks}</Badge>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Rating</span>
          <div className="flex items-center space-x-1">
            <Star className="h-4 w-4 text-yellow-500 fill-current" />
            <span className="text-sm font-medium">{stats.rating.toFixed(1)}</span>
          </div>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-gray-600">Total reviews</span>
          <Badge className="bg-green-100 text-green-700">{stats.totalReviews}</Badge>
        </div>
        
        {userRole === "tasker" && (
          <>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">This month earnings</span>
              <div className="flex items-center space-x-1">
                <PoundSterling className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">£{stats.monthlyEarnings.toFixed(2)}</span>
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
          </>
        )}
      </CardContent>
    </Card>
  );
};
