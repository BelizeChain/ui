'use client';

import React from 'react';
import { ReactQueryProvider } from '@/lib/react-query-provider';
import { TransactionProvider } from '@/components/TransactionToasts';
import { ApolloClient, InMemoryCache, ApolloProvider } from '@apollo/client';

// Apollo client for SubSquid indexer
const apolloClient = new ApolloClient({
  uri: process.env.NEXT_PUBLIC_INDEXER_GRAPHQL || 'http://localhost:4000/graphql',
  cache: new InMemoryCache(),
});

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ReactQueryProvider>
      <TransactionProvider>
        <ApolloProvider client={apolloClient}>{children}</ApolloProvider>
      </TransactionProvider>
    </ReactQueryProvider>
  );
}
