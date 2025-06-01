
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { TaskFormData, validateTaskForm } from "./utils/validation";
import { submitTask } from "./services/taskService";
import CategorySelection from "./CategorySelection";
import BudgetFields from "./BudgetFields";
import LocationAndPayment from "./LocationAndPayment";

const CreateTaskForm = () => {
  const [formData, setFormData] = useState<TaskFormData>({
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
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to create a task.",
        variant: "destructive",
      });
      return;
    }

    const validationError = validateTaskForm(formData);
    if (validationError) {
      toast({
        title: "Error",
        description: validationError,
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await submitTask(formData, user.id);

      if (error) {
        console.error('Error creating task:', error);
        toast({
          title: "Error",
          description: "Failed to create task. Please try again.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Task created successfully!",
        description: "Your task has been posted and will be visible to taskers.",
      });

      // Reset form
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

    } catch (error) {
      console.error('Unexpected error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
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
          <div>
            <Label htmlFor="title">Task Title</Label>
            <Input
              id="title"
              placeholder="e.g. IKEA PAX Wardrobe Assembly"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="description">Detailed Description</Label>
            <Textarea
              id="description"
              placeholder="Describe what needs to be assembled, dimensions, special requirements..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
              className="mt-1 min-h-[100px]"
            />
          </div>

          <CategorySelection formData={formData} setFormData={setFormData} />

          <BudgetFields formData={formData} setFormData={setFormData} />

          <LocationAndPayment formData={formData} setFormData={setFormData} />

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
