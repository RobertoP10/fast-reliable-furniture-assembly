
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { createTask } from "@/lib/api";
import { initialFormData } from "./taskFormConstants";
import type { Database } from '@/integrations/supabase/types';

type PaymentMethod = Database['public']['Enums']['payment_method'];

export const useTaskForm = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const validateForm = () => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to create a task.",
        variant: "destructive",
      });
      return false;
    }

    if (!formData.category || !formData.subcategory) {
      toast({
        title: "Error",
        description: "Please select category and subcategory.",
        variant: "destructive",
      });
      return false;
    }

    if (!formData.minBudget || !formData.maxBudget) {
      toast({
        title: "Error",
        description: "Please enter both minimum and maximum budget.",
        variant: "destructive",
      });
      return false;
    }

    if (!formData.address) {
      toast({
        title: "Error",
        description: "Please select your location.",
        variant: "destructive",
      });
      return false;
    }

    // Validate manual address if "Other" is selected
    if (formData.address === "Other (not listed)" && !formData.manualAddress.trim()) {
      toast({
        title: "Error",
        description: "Please enter your full address.",
        variant: "destructive",
      });
      return false;
    }

    if (!formData.requiredDate || !formData.requiredTime) {
      toast({
        title: "Error",
        description: "Please specify when you need the task completed. This helps taskers plan their schedule.",
        variant: "destructive",
      });
      return false;
    }

    // Validate that the required date is not in the past
    const selectedDate = new Date(`${formData.requiredDate}T${formData.requiredTime}`);
    const now = new Date();
    if (selectedDate <= now) {
      toast({
        title: "Error",
        description: "Please select a future date and time for task completion.",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const isOtherLocation = formData.address === "Other (not listed)";
      
      const taskData = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        subcategory: formData.subcategory,
        price_range_min: Number(formData.minBudget),
        price_range_max: Number(formData.maxBudget),
        location: isOtherLocation ? formData.manualAddress : formData.address,
        manual_address: isOtherLocation ? formData.manualAddress : null,
        needs_location_review: isOtherLocation,
        payment_method: formData.paymentMethod,
        required_date: formData.requiredDate,
        required_time: formData.requiredTime,
        client_id: user!.id,
      };

      await createTask(taskData);

      if (isOtherLocation) {
        toast({
          title: "Task submitted for review!",
          description: "Your task has been submitted and will be reviewed since your location is outside our standard service area.",
        });
      } else {
        toast({
          title: "Task created successfully!",
          description: "Your task has been posted and will be visible to taskers.",
        });
      }

      // Reset form
      setFormData(initialFormData);
    } catch (error) {
      console.error("❌ [FORM] Error creating task:", error);
      toast({
        title: "Error",
        description: `Failed to create task: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateFormData = (updates: Partial<typeof formData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  return {
    formData,
    isSubmitting,
    handleSubmit,
    updateFormData
  };
};
