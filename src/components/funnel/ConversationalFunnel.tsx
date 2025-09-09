import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { X, ArrowLeft, Bot } from "lucide-react";
import { ChatMessage } from "./ChatMessage";
import { ChatOptions } from "./ChatOptions";
import { ChatInput } from "./ChatInput";
import { FunnelProgress } from "./FunnelProgress";
import { TypingIndicator } from "./TypingIndicator";
import { 
  FunnelData, 
  ChatMessage as ChatMessageType, 
  FunnelStep,
  FURNITURE_TYPES,
  BRANDS,
  TIMING_OPTIONS,
  TRUST_POINTS
} from "@/types/funnel";

interface ConversationalFunnelProps {
  onClose: () => void;
  onComplete: (data: FunnelData, onLogin: () => void, onRegister: () => void) => void;
  isFullPage?: boolean;
}

export const ConversationalFunnel = ({ onClose, onComplete, isFullPage = false }: ConversationalFunnelProps) => {
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [currentStep, setCurrentStep] = useState<FunnelStep>('furniture-type');
  const [funnelData, setFunnelData] = useState<Partial<FunnelData>>({});
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize with first message
  useEffect(() => {
    addBotMessage(
      "Hi! I'm your MGS Assistant. I'll help you find the perfect tasker for your furniture assembly. What type of furniture do you need assembled?",
      FURNITURE_TYPES,
      TRUST_POINTS.verified
    );
  }, []);

  const addBotMessage = (content: string, options?: string[], trustPoint?: string) => {
    const message: ChatMessageType = {
      id: Date.now().toString(),
      type: 'bot',
      content,
      timestamp: new Date(),
      options,
      trustPoint
    };
    setMessages(prev => [...prev, message]);
  };

  const addUserMessage = (content: string) => {
    const message: ChatMessageType = {
      id: Date.now().toString(),
      type: 'user',
      content,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, message]);
  };

  const handleFurnitureTypeSelect = (type: string) => {
    addUserMessage(type);
    setFunnelData(prev => ({ ...prev, furnitureType: type }));
    
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      addBotMessage(
        "Great choice! Which brand is your furniture from? This helps me match you with taskers who have experience with that specific brand.",
        BRANDS,
        TRUST_POINTS.reviews
      );
      setCurrentStep('brand');
    }, 1500);
  };

  const handleBrandSelect = (brand: string) => {
    addUserMessage(brand);
    setFunnelData(prev => ({ ...prev, brand }));
    
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      addBotMessage(
        "Perfect! When would you like the assembly to be completed?",
        TIMING_OPTIONS
      );
      setCurrentStep('timing');
    }, 1500);
  };

  const handleTimingSelect = (timing: string) => {
    addUserMessage(timing);
    setFunnelData(prev => ({ ...prev, timing }));
    
    if (timing === "Choose Custom Date") {
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        addBotMessage("Please specify your preferred date (DD/MM/YYYY):");
        setCurrentStep('timing');
      }, 1500);
    } else {
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        addBotMessage(
          "Great! What's your budget for this assembly task? You can skip this if you prefer to see offers first.",
          undefined,
          TRUST_POINTS.payment
        );
        setCurrentStep('budget');
      }, 1500);
    }
  };

  const handleCustomDateSelect = (date: string) => {
    addUserMessage(date);
    setFunnelData(prev => ({ ...prev, customDate: date }));
    
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      addBotMessage(
        "Perfect! What's your budget for this assembly task? You can skip this if you prefer to see offers first.",
        undefined,
        TRUST_POINTS.payment
      );
      setCurrentStep('budget');
    }, 1500);
  };

  const handleBudgetSubmit = (budget: string) => {
    addUserMessage(`£${budget}`);
    setFunnelData(prev => ({ ...prev, budget }));
    showSummary();
  };

  const handleBudgetSkip = () => {
    addUserMessage("I'll see the offers first");
    showSummary();
  };

  const showSummary = () => {
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      const currentData = { ...funnelData };
      const summaryText = `Here's your request summary:
• Furniture: ${currentData.furnitureType}
• Brand: ${currentData.brand}  
• Timing: ${currentData.timing}${currentData.customDate ? ` (${currentData.customDate})` : ''}
${currentData.budget ? `• Budget: £${currentData.budget}` : '• Budget: Open to offers'}

🛡️ All taskers are manually verified
⭐ Check reviews before choosing your tasker
💰 You only pay after the task is completed

Ready to find your perfect tasker?`;
      
      addBotMessage(summaryText, ['Yes, find my tasker!', 'Let me edit something']);
      setCurrentStep('summary');
    }, 2000);
  };

  const handleSummaryConfirm = () => {
    addUserMessage("Yes, find my tasker!");
    
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      addBotMessage("Perfect! Create your free account to connect with verified taskers.");
      setCurrentStep('login-redirect');
      
      setTimeout(() => {
        const finalData: FunnelData = {
          ...funnelData as FunnelData,
          completed: true
        };
        onComplete(finalData, () => {}, () => {});
      }, 2000);
    }, 1500);
  };

  const getStepNumber = (): number => {
    switch (currentStep) {
      case 'furniture-type': return 1;
      case 'brand': return 2;
      case 'timing': return 3;
      case 'budget': return 4;
      case 'summary': return 5;
      case 'login-redirect': return 6;
      default: return 1;
    }
  };

  const canGoBack = (): boolean => {
    return currentStep !== 'furniture-type' && currentStep !== 'login-redirect';
  };

  const renderCurrentInput = () => {
    switch (currentStep) {
      case 'furniture-type':
        return (
          <ChatOptions 
            options={FURNITURE_TYPES}
            onSelect={handleFurnitureTypeSelect}
            disabled={isTyping}
          />
        );
      
      case 'brand':
        return (
          <ChatOptions 
            options={BRANDS}
            onSelect={handleBrandSelect}
            disabled={isTyping}
          />
        );
      
      case 'timing':
        if (funnelData.timing === "Choose Custom Date" && !funnelData.customDate) {
          return (
            <ChatInput
              placeholder="Enter date (DD/MM/YYYY)"
              onSubmit={handleCustomDateSelect}
              type="date"
            />
          );
        }
        return (
          <ChatOptions 
            options={TIMING_OPTIONS}
            onSelect={handleTimingSelect}
            disabled={isTyping}
          />
        );
      
      case 'budget':
        return (
          <ChatInput
            placeholder="Enter your budget"
            onSubmit={handleBudgetSubmit}
            onSkip={handleBudgetSkip}
            showSkip={true}
            type="number"
            prefix="£"
          />
        );
      
      case 'summary':
        return (
          <ChatOptions 
            options={['Yes, find my tasker!', 'Let me edit something']}
            onSelect={(option) => {
              if (option === 'Yes, find my tasker!') {
                handleSummaryConfirm();
              } else {
                // Reset to furniture type for editing
                setCurrentStep('furniture-type');
                setFunnelData({});
                setMessages([]);
                addBotMessage(
                  "Let's start over. What type of furniture do you need assembled?",
                  FURNITURE_TYPES,
                  TRUST_POINTS.verified
                );
              }
            }}
            disabled={isTyping}
          />
        );
      
      default:
        return null;
    }
  };

  return (
    <AnimatePresence>
      {isFullPage ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="w-full max-w-4xl mx-auto h-full flex flex-col"
        >
          <div className="bg-background border rounded-lg shadow-lg flex-1 flex flex-col min-h-0">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-primary rounded-full flex items-center justify-center">
                  <Bot className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <h2 className="font-semibold text-lg">MGS Assistant</h2>
                  <p className="text-sm text-muted-foreground">Let's find you the perfect tasker</p>
                </div>
              </div>
            </div>

            {/* Progress */}
            <div className="px-6 pt-4">
              <FunnelProgress currentStep={getStepNumber()} totalSteps={6} />
            </div>

            {/* Messages */}
            <div className="flex-1 p-6 overflow-y-auto min-h-0">
              {messages.map((message) => (
                <ChatMessage 
                  key={message.id} 
                  message={message}
                  isLast={message.id === messages[messages.length - 1]?.id}
                />
              ))}
              {isTyping && <TypingIndicator />}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-6 border-t">
              {renderCurrentInput()}
            </div>
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="w-full max-w-md"
          >
            <Card className="h-[600px] flex flex-col">
              {/* Header */}
              <div className="p-4 border-b flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {canGoBack() && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.history.back()}
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                  )}
                  <h2 className="font-semibold">Find Your Assembly Expert</h2>
                </div>
                <Button variant="ghost" size="sm" onClick={onClose}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Progress */}
              <div className="p-4 pb-0">
                <FunnelProgress currentStep={getStepNumber()} totalSteps={6} />
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {messages.map((message) => (
                  <ChatMessage key={message.id} message={message} />
                ))}
                {isTyping && <TypingIndicator />}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-4 border-t bg-muted/20">
                {renderCurrentInput()}
              </div>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};