'use client';

import React from 'react';
import { ReactQueryProvider } from '@/lib/react-query-provider';
import { TransactionProvider } from '@/components/TransactionToasts';

// Note: ApolloProvider for SubSquid indexer GraphQL will be added once
// the indexer is deployed. Until then, all data comes from direct RPC.

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ReactQueryProvider>
      <TransactionProvider>
        {children}
      </TransactionProvider>
    </ReactQueryProvider>
  );
}
