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
      
      <motion.div
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="flex flex-col sm:flex-row items-center gap-3"
      >
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => connect(true)}
          disabled={isConnecting}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-semibold hover:shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50"
        >
          <Wallet size={20} weight="bold" />
          {isConnecting ? 'Connecting...' : 'Connect Sovereign Session'}
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => connect(false)}
          disabled={isConnecting}
          className="flex items-center gap-2 px-5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl font-medium transition-all"
        >
          Browser Extension
        </motion.button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-8 p-4 bg-slate-900/80 rounded-xl border border-slate-800 max-w-md text-center"
      >
        <p className="text-xs text-slate-400 mb-2">Connecting to BelizeChain Ceiba Node</p>
        <div className="flex items-center justify-center gap-4 text-xs">
          <a
            href="https://polkadot.js.org/extension/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            <Download size={14} weight="bold" />
            Polkadot.js Extension
          </a>
          <span className="text-slate-600">•</span>
          <span className="text-slate-400">Ed25519 / NIST PQC Shielded</span>
        </div>
      </motion.div>
    </div>
  );
}
