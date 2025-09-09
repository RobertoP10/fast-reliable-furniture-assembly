import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { X, ArrowLeft } from "lucide-react";
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
}

export const ConversationalFunnel = ({ onClose, onComplete }: ConversationalFunnelProps) => {
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [currentStep, setCurrentStep] = useState<FunnelStep>('furniture-type');
  const [funnelData, setFunnelData] = useState<Partial<FunnelData>>({});
  const [isTyping, setIsTyping] = useState(false);
  const [awaitingResponse, setAwaitingResponse] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    // Initial welcome message
    addBotMessage("Hi! I'm here to help you find the perfect assembly expert. What type of furniture do you need assembled?", {
      options: FURNITURE_TYPES,
      trustPoint: TRUST_POINTS.verified
    });
  }, []);

  const addBotMessage = (content: string, options?: { options?: string[], trustPoint?: string }) => {
    setIsTyping(true);
    setTimeout(() => {
      const newMessage: ChatMessageType = {
        id: Date.now().toString(),
        type: 'bot',
        content,
        timestamp: new Date(),
        options: options?.options,
        trustPoint: options?.trustPoint
      };
      setMessages(prev => [...prev, newMessage]);
      setIsTyping(false);
      if (options?.options) {
        setAwaitingResponse(true);
      }
    }, 1000);
  };

  const addUserMessage = (content: string) => {
    const newMessage: ChatMessageType = {
      id: Date.now().toString(),
      type: 'user',
      content,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
    setAwaitingResponse(false);
  };

  const handleFurnitureTypeSelect = (type: string) => {
    addUserMessage(type);
    setFunnelData(prev => ({ ...prev, furnitureType: type }));
    setCurrentStep('brand');
    
    setTimeout(() => {
      addBotMessage(`Great choice! Which brand is your ${type.toLowerCase()} from?`, {
        options: BRANDS,
        trustPoint: TRUST_POINTS.reviews
      });
    }, 1500);
  };

  const handleBrandSelect = (brand: string) => {
    addUserMessage(brand);
    setFunnelData(prev => ({ ...prev, brand }));
    setCurrentStep('timing');
    
    setTimeout(() => {
      addBotMessage(`When would you like your ${brand} ${funnelData.furnitureType?.toLowerCase()} assembled?`, {
        options: TIMING_OPTIONS,
        trustPoint: TRUST_POINTS.payment
      });
    }, 1500);
  };

  const handleTimingSelect = (timing: string) => {
    addUserMessage(timing);
    let finalTiming = timing;
    
    if (timing === 'Choose Custom Date') {
      setFunnelData(prev => ({ ...prev, timing: 'custom' }));
      setCurrentStep('timing');
      setTimeout(() => {
        addBotMessage("Please select your preferred date:");
      }, 1500);
      return;
    } else {
      setFunnelData(prev => ({ ...prev, timing: finalTiming }));
      setCurrentStep('budget');
      
      setTimeout(() => {
        addBotMessage("What's your budget range? (This helps taskers provide better offers)");
      }, 1500);
    }
  };

  const handleCustomDateSelect = (date: string) => {
    addUserMessage(new Date(date).toLocaleDateString());
    setFunnelData(prev => ({ ...prev, timing: 'custom', customDate: date }));
    setCurrentStep('budget');
    
    setTimeout(() => {
      addBotMessage("What's your budget range? (This helps taskers provide better offers)");
    }, 1500);
  };

  const handleBudgetSubmit = (budget: string) => {
    addUserMessage(budget);
    setFunnelData(prev => ({ ...prev, budget }));
    setCurrentStep('summary');
    
    setTimeout(() => {
      showSummary();
    }, 1500);
  };

  const handleBudgetSkip = () => {
    addUserMessage("I'll discuss budget with taskers directly");
    setFunnelData(prev => ({ ...prev, budget: undefined }));
    setCurrentStep('summary');
    
    setTimeout(() => {
      showSummary();
    }, 1500);
  };

  const showSummary = () => {
    const timingText = funnelData.timing === 'custom' && funnelData.customDate 
      ? new Date(funnelData.customDate).toLocaleDateString()
      : funnelData.timing;
    
    const summary = `Perfect! Here's your request summary:

📦 ${funnelData.brand} ${funnelData.furnitureType}
📅 ${timingText}
💷 ${funnelData.budget || 'Open to offers'}

Ready to send this to verified taskers?`;

    addBotMessage(summary, {
      options: ['Yes, let\'s find taskers!', 'Let me change something']
    });
  };

  const handleSummaryConfirm = (response: string) => {
    addUserMessage(response);
    
    if (response === 'Yes, let\'s find taskers!') {
      setCurrentStep('login-redirect');
      setTimeout(() => {
        addBotMessage("Excellent! To send your request to verified taskers, please log in or create an account.");
        setTimeout(() => {
          const finalData: FunnelData = {
            furnitureType: funnelData.furnitureType!,
            brand: funnelData.brand!,
            timing: funnelData.timing!,
            customDate: funnelData.customDate,
            budget: funnelData.budget,
            completed: true
          };
          onComplete(finalData, () => {}, () => {});
        }, 2000);
      }, 1500);
    } else {
      // Reset to furniture type selection
      setCurrentStep('furniture-type');
      setFunnelData({});
      setTimeout(() => {
        addBotMessage("No problem! Let's start over. What type of furniture do you need assembled?", {
          options: FURNITURE_TYPES,
          trustPoint: TRUST_POINTS.verified
        });
      }, 1500);
    }
  };

  const getStepNumber = () => {
    const stepMap = {
      'furniture-type': 1,
      'brand': 2,
      'timing': 3,
      'budget': 4,
      'summary': 5,
      'login-redirect': 6
    };
    return stepMap[currentStep];
  };

  const canGoBack = () => {
    return messages.length > 1 && currentStep !== 'login-redirect';
  };

  const renderCurrentInput = () => {
    if (awaitingResponse) return null;

    switch (currentStep) {
      case 'furniture-type':
        return (
          <ChatOptions
            options={FURNITURE_TYPES}
            onSelect={handleFurnitureTypeSelect}
          />
        );
      case 'brand':
        return (
          <ChatOptions
            options={BRANDS}
            onSelect={handleBrandSelect}
          />
        );
      case 'timing':
        if (funnelData.timing === 'custom' && !funnelData.customDate) {
          return (
            <ChatInput
              type="date"
              placeholder="Select date"
              onSubmit={handleCustomDateSelect}
            />
          );
        }
        return (
          <ChatOptions
            options={TIMING_OPTIONS}
            onSelect={handleTimingSelect}
          />
        );
      case 'budget':
        return (
          <ChatInput
            placeholder="Enter your budget range"
            prefix="£"
            onSubmit={handleBudgetSubmit}
            onSkip={handleBudgetSkip}
            showSkip={true}
          />
        );
      case 'summary':
        return (
          <ChatOptions
            options={['Yes, let\'s find taskers!', 'Let me change something']}
            onSelect={handleSummaryConfirm}
          />
        );
      default:
        return null;
    }
  };

  return (
    <AnimatePresence>
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
    </AnimatePresence>
  );
};