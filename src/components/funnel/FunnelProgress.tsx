import { motion } from "framer-motion";
import { Progress } from "@/components/ui/progress";

interface FunnelProgressProps {
  currentStep: number;
  totalSteps: number;
}

export const FunnelProgress = ({ currentStep, totalSteps }: FunnelProgressProps) => {
  const progressValue = (currentStep / totalSteps) * 100;

  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm text-muted-foreground">
          Step {currentStep} of {totalSteps}
        </span>
        <span className="text-sm font-medium text-primary">
          {Math.round(progressValue)}% Complete
        </span>
      </div>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: "100%" }}
      >
        <Progress value={progressValue} className="h-2" />
      </motion.div>
    </div>
  );
};