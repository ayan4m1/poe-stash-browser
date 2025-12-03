import { lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { AuthProvider } from 'react-oauth2-code-pkce';
import { HashRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import SuspenseFallback from './SuspenseFallback';
import { baseApiUrl } from '../utils';

import '../index.scss';

const Home = lazy(() => import('../pages/Home'));
const Stashes = lazy(() => import('../pages/Stashes'));
const Settings = lazy(() => import('../pages/Settings'));

const queryClient = new QueryClient();

const App = () => (
  <Suspense fallback={<SuspenseFallback />}>
    <QueryClientProvider client={queryClient}>
      <AuthProvider
        authConfig={{
          clientId: 'stashr',
          authorizationEndpoint: `${baseApiUrl}oauth/authorize`,
          tokenEndpoint: `${baseApiUrl}oauth/token`,
          redirectUri: 'http://localhost:3000/main_window/index.html',
          scope: 'account:profile account:stashes',
          autoLogin: false,
          decodeToken: false
        }}
      >
        <Routes>
          <Route element={<Home />} index />
          <Route element={<Stashes />} path="/stashes" />
          <Route element={<Settings />} path="/settings" />
        </Routes>
      </AuthProvider>
    </QueryClientProvider>
  </Suspense>
);

const root = createRoot(document.getElementById('root'));

root.render(
  <HashRouter>
    <App />
  </HashRouter>
);
