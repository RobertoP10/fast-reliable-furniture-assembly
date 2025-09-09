import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Calendar } from "lucide-react";

interface ChatInputProps {
  placeholder: string;
  onSubmit: (value: string) => void;
  onSkip?: () => void;
  showSkip?: boolean;
  type?: 'text' | 'date';
  prefix?: string;
}

export const ChatInput = ({ 
  placeholder, 
  onSubmit, 
  onSkip, 
  showSkip = false, 
  type = 'text',
  prefix 
}: ChatInputProps) => {
  const [value, setValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) {
      onSubmit(prefix ? `${prefix}${value}` : value);
      setValue('');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-3"
    >
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="flex-1 relative">
          {prefix && (
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground text-sm">
              {prefix}
            </span>
          )}
          <Input
            type={type}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
            className={`${prefix ? 'pl-8' : ''} pr-12`}
          />
          {type === 'date' && (
            <Calendar className="absolute right-10 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          )}
        </div>
        <Button type="submit" size="sm" disabled={!value.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
      
      {showSkip && onSkip && (
        <div className="text-center">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onSkip}
            className="text-muted-foreground hover:text-foreground"
          >
            Skip this step
          </Button>
        </div>
      )}
    </motion.div>
  );
};