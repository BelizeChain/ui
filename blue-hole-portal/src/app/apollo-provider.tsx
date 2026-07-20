'use client';

import React from 'react';
import { ApolloClient, InMemoryCache, ApolloProvider as BaseApolloProvider } from '@apollo/client';

// Use environment variable if available, else fallback to local subsquid endpoint
const GRAPHQL_ENDPOINT = process.env.NEXT_PUBLIC_INDEXER_URL || 'http://localhost:4350/graphql';

const client = new ApolloClient({
  uri: GRAPHQL_ENDPOINT,
  cache: new InMemoryCache(),
});

export function ApolloProvider({ children }: { children: React.ReactNode }) {
  return <BaseApolloProvider client={client}>{children}</BaseApolloProvider>;
}
