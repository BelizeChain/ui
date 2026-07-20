'use client';

import React from 'react';
import { ReactQueryProvider } from '@/lib/react-query-provider';
import { TransactionProvider } from '@/components/TransactionToasts';
import { ApolloProvider } from './apollo-provider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ApolloProvider>
      <ReactQueryProvider>
        <TransactionProvider>
          {children}
        </TransactionProvider>
      </ReactQueryProvider>
    </ApolloProvider>
  );
}
