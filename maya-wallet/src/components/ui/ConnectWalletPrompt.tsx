// Connect Wallet Prompt Component
import { motion } from 'framer-motion';
import { Wallet, Download } from 'phosphor-react';
import { useWallet } from '@/contexts/WalletContext';

interface ConnectWalletPromptProps {
  message?: string;
  fullScreen?: boolean;
}

export function ConnectWalletPrompt({ 
  message = 'Connect your wallet to access this feature',
  fullScreen = false
}: ConnectWalletPromptProps) {
  const { connect, isConnecting } = useWallet();

  const containerClass = fullScreen 
    ? 'fixed inset-0 flex flex-col items-center justify-center bg-gray-900/80 backdrop-blur-sm z-50 p-6'
    : 'flex flex-col items-center justify-center min-h-[400px] p-6';

  return (
    <div className={containerClass}>
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-blue-500 mb-6"
      >
        <Wallet size={64} weight="fill" />
      </motion.div>
      
      <motion.h3
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="text-xl font-bold text-white mb-2"
      >
        Wallet Connection Required
      </motion.h3>
      
      <motion.p
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-gray-400 mb-6 text-center max-w-md"
      >
        {message}
      </motion.p>
      
      <motion.button
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={connect}
        disabled={isConnecting}
        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Wallet size={20} weight="bold" />
        {isConnecting ? 'Connecting...' : 'Connect Wallet'}
      </motion.button>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-8 p-4 bg-gray-800/50 rounded-xl border border-gray-700/50 max-w-md"
      >
        <p className="text-sm text-gray-400 mb-3">Don't have a wallet?</p>
        <a
          href="https://polkadot.js.org/extension/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors text-sm"
        >
          <Download size={16} weight="bold" />
          Install Polkadot.js Extension
        </a>
      </motion.div>
    </div>
  );
}
