'use client';

import React from 'react';
import { ReactQueryProvider } from '@/lib/react-query-provider';
import { TransactionProvider } from '@/components/TransactionToasts';

if (typeof window !== 'undefined') {
  const originalError = console.error;
  console.error = (...args: any[]) => {
    if (typeof args[0] === 'string' && (args[0].includes('VEC:') || args[0].includes('RPC-CORE:'))) {
      return;
    }
    originalError.apply(console, args);
  };
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ReactQueryProvider>
      <TransactionProvider>
        {children}
      </TransactionProvider>
    </ReactQueryProvider>
  );
}
