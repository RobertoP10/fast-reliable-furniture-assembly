
import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const EmailPreferences = () => {
  const queryClient = useQueryClient();
  
  const { data: user, isLoading } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');
      
      const { data, error } = await supabase
        .from('users')
        .select('email_notifications_enabled')
        .eq('id', user.id)
        .single();
      
      if (error) throw error;
      return data;
    }
  });

  const updatePreferences = useMutation({
    mutationFn: async (enabled: boolean) => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) throw new Error('No user found');
      
      const { data, error } = await supabase
        .from('users')
        .update({ email_notifications_enabled: enabled })
        .eq('id', authUser.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-user'] });
      toast.success('Email preferences updated successfully');
    },
    onError: (error) => {
      console.error('Error updating email preferences:', error);
      toast.error('Failed to update email preferences');
    }
  });

  const handleToggle = (enabled: boolean) => {
    updatePreferences.mutate(enabled);
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Email Notifications</CardTitle>
        <CardDescription>
          Manage your email notification preferences
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-2">
          <Switch 
            id="email-notifications"
            checked={user?.email_notifications_enabled ?? true}
            onCheckedChange={handleToggle}
            disabled={updatePreferences.isPending}
          />
          <Label htmlFor="email-notifications">
            Receive email notifications for new tasks
          </Label>
        </div>
        <p className="text-sm text-muted-foreground">
          When enabled, you'll receive an email notification whenever a new task is posted that matches your location and preferences.
        </p>
      </CardContent>
    </Card>
  );
};
