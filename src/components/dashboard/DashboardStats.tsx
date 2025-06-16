
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
      // Calculate rating and reviews directly from reviews table
      const { data: reviews, error: reviewsError } = await supabase
        .from('reviews')
        .select('rating')
        .eq('reviewee_id', user.id);

      if (reviewsError) {
        console.error('Error fetching reviews:', reviewsError);
        return;
      }

      const rating = reviews && reviews.length > 0 
        ? reviews.reduce((sum, review) => sum + (review?.rating || 0), 0) / reviews.length 
        : 0;
      const totalReviews = reviews?.length || 0;

      let activeTasks = 0;
      let completedTasks = 0;
      let monthlyEarnings = 0;

      if (userRole === "client") {
        // For clients: count their own tasks
        const { data: clientTasks, error: clientTasksError } = await supabase
          .from('task_requests')
          .select('status')
          .eq('client_id', user.id);

        if (clientTasksError) {
          console.error('Error fetching client tasks:', clientTasksError);
        } else if (clientTasks) {
          activeTasks = clientTasks.filter(task => 
            task?.status === 'pending' || task?.status === 'accepted'
          ).length;
          completedTasks = clientTasks.filter(task => 
            task?.status === 'completed'
          ).length;
        }
      } else {
        // For taskers: first get their accepted offers
        const { data: taskerOffers, error: offersError } = await supabase
          .from('offers')
          .select('id, task_id, price, is_accepted')
          .eq('tasker_id', user.id)
          .eq('is_accepted', true);

        if (offersError) {
          console.error('Error fetching tasker offers:', offersError);
        } else if (taskerOffers && taskerOffers.length > 0) {
          const taskIds = taskerOffers.map(offer => offer?.task_id).filter(Boolean);
          
          if (taskIds.length > 0) {
            // Get the corresponding tasks
            const { data: taskerTasks, error: taskerTasksError } = await supabase
              .from('task_requests')
              .select('id, status, completed_at, accepted_offer_id')
              .in('id', taskIds);

            if (taskerTasksError) {
              console.error('Error fetching tasker tasks:', taskerTasksError);
            } else if (taskerTasks) {
              activeTasks = taskerTasks.filter(task => 
                task?.status === 'accepted'
              ).length;
              
              completedTasks = taskerTasks.filter(task => 
                task?.status === 'completed'
              ).length;

              // Calculate monthly earnings
              const currentMonth = new Date().getMonth();
              const currentYear = new Date().getFullYear();
              
              monthlyEarnings = taskerTasks
                .filter(task => 
                  task?.status === 'completed' &&
                  task?.completed_at &&
                  new Date(task.completed_at).getMonth() === currentMonth &&
                  new Date(task.completed_at).getFullYear() === currentYear
                )
                .reduce((total, task) => {
                  const correspondingOffer = taskerOffers.find(offer => 
                    offer?.task_id === task?.id && offer?.id === task?.accepted_offer_id
                  );
                  return total + (Number(correspondingOffer?.price) || 0);
                }, 0);
            }
          }
        }
      }

      setStats({
        activeTasks,
        completedTasks,
        rating,
        totalReviews,
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

  // Set up real-time listener for reviews to update stats immediately
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('dashboard-stats-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reviews',
          filter: `reviewee_id=eq.${user.id}`
        },
        () => {
          console.log('Review update detected, refreshing stats');
          fetchStats();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'task_requests'
        },
        () => {
          console.log('Task update detected, refreshing stats');
          fetchStats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

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
