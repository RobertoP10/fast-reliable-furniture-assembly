
export interface TaskFormData {
  title: string;
  description: string;
  category: string;
  subcategory: string;
  minBudget: string;
  maxBudget: string;
  address: string;
  paymentMethod: string;
}

export const validateTaskForm = (formData: TaskFormData) => {
  if (!formData.category || !formData.subcategory) {
    return "Please select category and subcategory.";
  }

  if (!formData.minBudget || !formData.maxBudget) {
    return "Please enter both minimum and maximum budget.";
  }

  return null;
};
