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
      staleTime: 6000 * 3600,
      refetchOnMount: false,
      refetchOnReconnect: false
    }
  }
});
const persister = createAsyncStoragePersister({ storage: localStorage });
const rootElem = document.getElementById('root');

if (rootElem) {
  const root = createRoot(rootElem);

  root.render(
    <HashRouter>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link
        rel="preconnect"
        href="https://fonts.gstatic.com"
        crossOrigin="anonymous"
      />
      <link
        href="https://fonts.googleapis.com/css2?family=Inter:opsz@14..32&display=swap"
        rel="stylesheet"
      ></link>
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
}
