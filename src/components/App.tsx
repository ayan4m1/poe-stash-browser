import { lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { AuthProvider } from 'react-oauth2-code-pkce';
import { HashRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { authConfig } from '../utils';
import AppContextProvider from './AppContext';
import SuspenseFallback from './SuspenseFallback';

import '../index.scss';

const Home = lazy(() => import('../pages/Home'));
const Stashes = lazy(() => import('../pages/Stashes'));
const Settings = lazy(() => import('../pages/Settings'));

const queryClient = new QueryClient();
const root = createRoot(document.getElementById('root'));

root.render(
  <HashRouter>
    <Suspense fallback={<SuspenseFallback />}>
      <AppContextProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider authConfig={authConfig}>
            <Routes>
              <Route element={<Home />} index />
              <Route element={<Stashes />} path="/stashes" />
              <Route element={<Settings />} path="/settings" />
            </Routes>
          </AuthProvider>
        </QueryClientProvider>
      </AppContextProvider>
    </Suspense>
  </HashRouter>
);
