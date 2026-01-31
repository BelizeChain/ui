// Reusable Loading Spinner Component
import { motion } from 'framer-motion';
import { CircleNotch } from 'phosphor-react';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  fullScreen?: boolean;
}

export function LoadingSpinner({ 
  message = 'Loading...', 
  size = 'md',
  fullScreen = false 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-12 w-12',
    lg: 'h-16 w-16'
  };

  const containerClass = fullScreen 
    ? 'fixed inset-0 flex flex-col items-center justify-center bg-gray-900/80 backdrop-blur-sm z-50'
    : 'flex flex-col items-center justify-center min-h-[400px] p-6';

  return (
    <div className={containerClass}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        className={sizeClasses[size]}
      >
        <CircleNotch size={size === 'sm' ? 24 : size === 'md' ? 48 : 64} weight="bold" className="text-blue-500" />
      </motion.div>
      {message && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-4 text-gray-400 text-center"
        >
          {message}
        </motion.p>
      )}
    </div>
  );
}
