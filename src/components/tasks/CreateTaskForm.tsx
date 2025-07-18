
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useTaskForm } from "./form/useTaskForm";
import { TaskBasicInfo } from "./form/TaskBasicInfo";
import { TaskCategory } from "./form/TaskCategory";
import { TaskBudget } from "./form/TaskBudget";
import { TaskLocation } from "./form/TaskLocation";
import { TaskSchedule } from "./form/TaskSchedule";
import { TaskPayment } from "./form/TaskPayment";

const CreateTaskForm = () => {
  const { formData, isSubmitting, handleSubmit, updateFormData } = useTaskForm();

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
          <TaskBasicInfo
            title={formData.title}
            description={formData.description}
            onUpdate={updateFormData}
          />

          <TaskCategory
            category={formData.category}
            subcategory={formData.subcategory}
            onUpdate={updateFormData}
          />

          <TaskBudget
            minBudget={formData.minBudget}
            maxBudget={formData.maxBudget}
            onUpdate={updateFormData}
          />

          <TaskLocation
            address={formData.address}
            onUpdate={updateFormData}
          />

          <TaskSchedule
            requiredDate={formData.requiredDate}
            requiredTime={formData.requiredTime}
            onUpdate={updateFormData}
          />

          <TaskPayment
            paymentMethod={formData.paymentMethod}
            onUpdate={updateFormData}
          />

          <Button 
            type="submit" 
            className="w-full bg-blue-600 hover:bg-blue-700"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Creating..." : "Post Task"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default CreateTaskForm;
