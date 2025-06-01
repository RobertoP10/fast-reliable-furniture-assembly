
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import TaskFormFields from "./TaskFormFields";

interface CreateTaskFormProps {
  onTaskCreated?: () => void;
}

const CreateTaskForm = ({ onTaskCreated }: CreateTaskFormProps) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    subcategory: "",
    minBudget: "",
    maxBudget: "",
    address: "",
    paymentMethod: "cash"
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.category || !formData.subcategory) {
      toast({
        title: "Error",
        description: "Please select category and subcategory.",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to create a task.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      console.log('Creating task with data:', formData);
      const { data, error } = await supabase
        .from('task_requests')
        .insert({
          client_id: user.id,
          description: formData.description,
          category: formData.category,
          subcategory: formData.subcategory,
          price_range: `${formData.minBudget}-${formData.maxBudget}`,
          location: formData.address,
          status: 'pending',
          created_at: new Date().toISOString()
        })
        .select();

      if (error) {
        console.error('Error creating task:', error);
        toast({
          title: "Error",
          description: `Failed to create task: ${error.message}`,
          variant: "destructive",
        });
        return;
      }

      console.log('Task created successfully:', data);
      toast({
        title: "Task created successfully!",
        description: "Your task has been posted and will be visible to taskers.",
      });

      // Reset form completely
      setFormData({
        title: "",
        description: "",
        category: "",
        subcategory: "",
        minBudget: "",
        maxBudget: "",
        address: "",
        paymentMethod: "cash"
      });

      // Call the callback if provided
      if (onTaskCreated) {
        onTaskCreated();
      }
    } catch (error) {
      console.error('Error creating task:', error);
      toast({
        title: "Error",
        description: "Failed to create task. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="shadow-lg border-0">
      <CardHeader>
        <CardTitle className="text-blue-900">Create a New Task</CardTitle>
        <CardDescription>
          Describe what you need assembled and receive offers from taskers
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <TaskFormFields formData={formData} setFormData={setFormData} />
          
          <Button 
            type="submit" 
            className="w-full bg-blue-600 hover:bg-blue-700"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Creating Task..." : "Post Task"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default CreateTaskForm;
