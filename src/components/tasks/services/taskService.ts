
import { supabase } from "@/integrations/supabase/client";
import { TaskFormData } from "../utils/validation";

export const submitTask = async (formData: TaskFormData, userId: string) => {
  const priceRange = `£${formData.minBudget} - £${formData.maxBudget}`;
  
  const { error } = await supabase
    .from('task_requests')
    .insert({
      client_id: userId,
      category: formData.category,
      subcategory: formData.subcategory,
      description: formData.description,
      price_range: priceRange,
      location: formData.address,
      status: 'pending'
    });

  return { error };
};
