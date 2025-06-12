
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { createTask } from "@/lib/tasks";
import { useToast } from "@/hooks/use-toast";

export interface TaskFormData {
  title: string;
  description: string;
  category: string;
  subcategory: string;
  priceRangeMin: number;
  priceRangeMax: number;
  address: string;
  manualAddress: string;
  paymentMethod: string;
  requiredDate: string;
  requiredTime: string;
  needsLocationReview?: boolean;
}

export const useTaskForm = (onTaskCreated?: () => void) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<TaskFormData>({
    title: "",
    description: "",
    category: "",
    subcategory: "",
    priceRangeMin: 0,
    priceRangeMax: 0,
    address: "",
    manualAddress: "",
    paymentMethod: "",
    requiredDate: "",
    requiredTime: "",
    needsLocationReview: false,
  });

  const updateFormData = (updates: Partial<TaskFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to create a task",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      console.log('🚀 [TASK] Creating task with data:', formData);
      
      const taskData = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        subcategory: formData.subcategory,
        price_range_min: formData.priceRangeMin,
        price_range_max: formData.priceRangeMax,
        location: formData.address,
        manual_address: formData.address === "Other (not listed)" ? formData.manualAddress : null,
        payment_method: formData.paymentMethod as any,
        required_date: formData.requiredDate || null,
        required_time: formData.requiredTime || null,
        client_id: user.id,
        needs_location_review: formData.address === "Other (not listed)",
      };

      const newTask = await createTask(taskData);
      
      if (formData.address === "Other (not listed)") {
        toast({
          title: "Task Created Successfully!",
          description: "Your task has been submitted for location review. It will be visible to taskers once approved by our team.",
        });
      } else {
        toast({
          title: "Task Created Successfully!",
          description: "Your task is now live and taskers can start making offers.",
        });
      }

      // Reset form
      setFormData({
        title: "",
        description: "",
        category: "",
        subcategory: "",
        priceRangeMin: 0,
        priceRangeMax: 0,
        address: "",
        manualAddress: "",
        paymentMethod: "",
        requiredDate: "",
        requiredTime: "",
        needsLocationReview: false,
      });

      onTaskCreated?.();
    } catch (error) {
      console.error('❌ [TASK] Error creating task:', error);
      toast({
        title: "Error",
        description: `Failed to create task: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    formData,
    updateFormData,
    handleSubmit,
    isSubmitting,
  };
};
