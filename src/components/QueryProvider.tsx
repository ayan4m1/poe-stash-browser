import { ComponentProps } from 'react';
import {
  defaultShouldDehydrateQuery,
  Query,
  QueryClient
} from '@tanstack/query-core';
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

// poe.ninja overviews have no business outliving their half-hour staleness, and
// they are big enough to overflow the localStorage quota - at which point the
// persister throws, persistQueryClient calls removeClient(), and the stash cache
// goes with it. Stash data is far more expensive to refetch, so keep prices in
// memory only.
const dehydrateOptions = {
  shouldDehydrateQuery: (query: Query) =>
    defaultShouldDehydrateQuery(query) && query.queryKey[0] !== 'ninja'
};

export default function QueryProvider({ children }: ComponentProps<'div'>) {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister, dehydrateOptions }}
    >
      {children}
    </PersistQueryClientProvider>
  );
}
