import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

interface ChatOptionsProps {
  options: string[];
  onSelect: (option: string) => void;
  disabled?: boolean;
}

export const ChatOptions = ({ options, onSelect, disabled }: ChatOptionsProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}
      className="flex flex-wrap gap-2 mb-4"
    >
      {options.map((option, index) => (
        <motion.div
          key={option}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2, delay: index * 0.1 }}
        >
          <Button
            variant="outline"
            size="sm"
            onClick={() => onSelect(option)}
            disabled={disabled}
            className="hover:bg-primary/10 hover:border-primary/20 transition-colors"
          >
            {option}
          </Button>
        </motion.div>
      ))}
    </motion.div>
  );
};