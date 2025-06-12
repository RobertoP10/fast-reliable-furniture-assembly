
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { TaskFormData, westMidlandsTowns } from "./taskFormConstants";

export const useTaskForm = () => {
  const [formData, setFormData] = useState<TaskFormData>({
    title: "",
    description: "",
    category: "",
    subcategory: "",
    location: "",
    manualAddress: "",
    priceRangeMin: 0,
    priceRangeMax: 0,
    paymentMethod: "cash",
    requiredDate: "",
    requiredTime: "",
  });

  const [loading, setLoading] = useState(false);

  const updateFormData = (updates: Partial<TaskFormData>) => {
    setFormData(prev => ({
      ...prev,
      ...updates
    }));
  };

  const isLocationInOperationalArea = (location: string) => {
    // Check if location is in our operational area (West Midlands towns)
    return westMidlandsTowns.includes(location);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitTask();
  };

  const submitTask = async () => {
    try {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in to create a task");
        return;
      }

      // Determine if task needs location review - this is the key fix
      const isOtherLocation = formData.location === "Other (not listed)";
      const isOutsideOperationalArea = !isLocationInOperationalArea(formData.location);
      const needsLocationReview = isOtherLocation || isOutsideOperationalArea;
      
      console.log('🔍 [TASK CREATION] Location check:', {
        selectedLocation: formData.location,
        isOtherLocation,
        isOutsideOperationalArea,
        isInOperationalArea: isLocationInOperationalArea(formData.location),
        needsLocationReview
      });

      const taskData = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        subcategory: formData.subcategory,
        location: formData.location,
        manual_address: isOtherLocation ? formData.manualAddress : null,
        price_range_min: formData.priceRangeMin,
        price_range_max: formData.priceRangeMax,
        payment_method: formData.paymentMethod,
        required_date: formData.requiredDate || null,
        required_time: formData.requiredTime || null,
        client_id: user.id,
        needs_location_review: needsLocationReview
      };

      console.log('📝 [TASK CREATION] Submitting task with data:', taskData);

      const { data, error } = await supabase
        .from('task_requests')
        .insert([taskData])
        .select()
        .single();

      if (error) {
        console.error('❌ [TASK CREATION] Error creating task:', error);
        throw error;
      }

      console.log('✅ [TASK CREATION] Task created successfully:', data);

      if (needsLocationReview) {
        toast.success("Task submitted for location review! Our team will verify the service area and approve your task soon.");
      } else {
        toast.success("Task created successfully!");
      }

      // Reset form
      setFormData({
        title: "",
        description: "",
        category: "",
        subcategory: "",
        location: "",
        manualAddress: "",
        priceRangeMin: 0,
        priceRangeMax: 0,
        paymentMethod: "cash",
        requiredDate: "",
        requiredTime: "",
      });

      return data;
    } catch (error) {
      console.error('❌ [TASK CREATION] Error:', error);
      toast.error("Failed to create task. Please try again.");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    formData,
    loading,
    isSubmitting: loading,
    updateFormData,
    submitTask,
    handleSubmit
  };
};
