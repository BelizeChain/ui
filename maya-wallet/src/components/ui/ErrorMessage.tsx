// Reusable Error Message Component
import { motion } from 'framer-motion';
import { Warning, ArrowClockwise } from 'phosphor-react';

interface ErrorMessageProps {
  message?: string;
  title?: string;
  onRetry?: () => void;
  fullScreen?: boolean;
}

export function ErrorMessage({ 
  message = 'Something went wrong. Please try again.',
  title = 'Error',
  onRetry,
  fullScreen = false
}: ErrorMessageProps) {
  const containerClass = fullScreen 
    ? 'fixed inset-0 flex flex-col items-center justify-center bg-gray-900/80 backdrop-blur-sm z-50 p-6'
    : 'flex flex-col items-center justify-center min-h-[400px] p-6';

  return (
    <div className={containerClass}>
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-red-500 mb-4"
      >
        <Warning size={64} weight="fill" />
      </motion.div>
      
      <motion.h3
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="text-xl font-bold text-white mb-2"
      >
        {title}
      </motion.h3>
      
      <motion.p
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-gray-400 mb-6 text-center max-w-md"
      >
        {message}
      </motion.p>
      
      {onRetry && (
        <motion.button
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onRetry}
          className="flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-600 transition-colors"
        >
          <ArrowClockwise size={20} weight="bold" />
          Try Again
        </motion.button>
      )}
    </div>
  );
}
