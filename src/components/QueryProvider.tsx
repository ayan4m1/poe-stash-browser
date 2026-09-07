import { ComponentProps } from 'react';
import { QueryClient } from '@tanstack/query-core';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';

const gcTime =
  1000 * 3600 * parseInt(localStorage.getItem('app.cacheHours') ?? '24', 10);
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime,
      staleTime: gcTime,
      refetchOnMount: false,
      refetchOnReconnect: false
    }
  }
});
const persister = createAsyncStoragePersister({ storage: localStorage });

export default function QueryProvider({ children }: ComponentProps<'div'>) {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister }}
    >
      {children}
    </PersistQueryClientProvider>
  );
}
