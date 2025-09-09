import { motion } from "framer-motion";

export const TypingIndicator = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex gap-3 mb-4"
    >
      <div className="h-8 w-8 bg-primary rounded-full flex items-center justify-center">
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-1 h-1 bg-primary-foreground rounded-full"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}
        </div>
      </div>
      <div className="bg-card border px-4 py-3 rounded-2xl">
        <span className="text-sm text-muted-foreground">MGS Assistant is typing...</span>
      </div>
    </motion.div>
  );
};