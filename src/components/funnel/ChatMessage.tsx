import { motion } from "framer-motion";
import { ChatMessage as ChatMessageType } from "@/types/funnel";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bot, User } from "lucide-react";

interface ChatMessageProps {
  message: ChatMessageType;
  isLast?: boolean;
}

export const ChatMessage = ({ message, isLast }: ChatMessageProps) => {
  const isBot = message.type === 'bot';
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex gap-3 mb-4 ${isBot ? 'justify-start' : 'justify-end'}`}
    >
      {isBot && (
        <Avatar className="h-8 w-8 bg-primary">
          <AvatarFallback className="bg-primary text-primary-foreground">
            <Bot className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
      )}
      
      <div className={`max-w-[80%] ${isBot ? 'order-2' : 'order-1'}`}>
        <div
          className={`px-4 py-3 rounded-2xl ${
            isBot
              ? 'bg-card border text-card-foreground'
              : 'bg-primary text-primary-foreground'
          }`}
        >
          <p className="text-sm leading-relaxed">{message.content}</p>
          {message.trustPoint && (
            <div className="mt-2 text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded">
              {message.trustPoint}
            </div>
          )}
        </div>
      </div>

      {!isBot && (
        <Avatar className="h-8 w-8 bg-muted order-3">
          <AvatarFallback className="bg-muted text-muted-foreground">
            <User className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
      )}
    </motion.div>
  );
};