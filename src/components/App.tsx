import { lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient } from '@tanstack/react-query';
import { AuthProvider } from 'react-oauth2-code-pkce';
import { HashRouter, Route, Routes } from 'react-router-dom';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';

import { authConfig } from '../utils';
import AppContextProvider from './AppContext';
import SuspenseFallback from './SuspenseFallback';

import '../index.scss';

const Home = lazy(() => import('../pages/Home'));
const Stashes = lazy(() => import('../pages/Stashes'));
const Settings = lazy(() => import('../pages/Settings'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 3600 * 24,
      staleTime: 1000 * 3600,
      refetchOnMount: false,
      refetchOnReconnect: false
    }
  }
});
const persister = createAsyncStoragePersister({ storage: localStorage });
const root = createRoot(document.getElementById('root'));

root.render(
  <HashRouter>
    <Suspense fallback={<SuspenseFallback />}>
      <AppContextProvider>
        <PersistQueryClientProvider
          client={queryClient}
          persistOptions={{ persister }}
        >
          <AuthProvider authConfig={authConfig}>
            <Routes>
              <Route element={<Home />} index />
              <Route element={<Stashes />} path="/stashes" />
              <Route element={<Settings />} path="/settings" />
            </Routes>
          </AuthProvider>
        </PersistQueryClientProvider>
      </AppContextProvider>
    </Suspense>
  </HashRouter>
);
