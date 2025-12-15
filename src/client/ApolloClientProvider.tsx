'use client';

import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client';
import { ApolloProvider } from '@apollo/client/react';
import type { ReactNode } from 'react';

const client = new ApolloClient({
  link: new HttpLink({
    uri: '/api/graphql', // GraphQL 엔드포인트
  }),
  cache: new InMemoryCache(),
});

interface ApolloClientProviderProps {
  children: ReactNode;
  client?: ApolloClient;
}

function ApolloClientProvider({
  children,
  client: providedClient,
}: ApolloClientProviderProps) {
  return (
    <ApolloProvider client={providedClient || client}>
      {children}
    </ApolloProvider>
  );
}

export { client, ApolloClientProvider };
