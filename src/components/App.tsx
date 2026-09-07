import { lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { AuthProvider } from 'react-oauth2-code-pkce';
import { HashRouter, Route, Routes } from 'react-router-dom';

import QueryProvider from './QueryProvider';
import AppContextProvider from './AppContext';
import SuspenseFallback from './SuspenseFallback';
import { authConfig } from '../utils';

import '../index.scss';

const Home = lazy(() => import('../pages/Home'));
const Items = lazy(() => import('../pages/Items'));
const Stashes = lazy(() => import('../pages/Stashes'));
const Settings = lazy(() => import('../pages/Settings'));

const rootElem = document.getElementById('root');

if (rootElem) {
  const root = createRoot(rootElem);

  root.render(
    <HashRouter>
      <link href="https://fonts.googleapis.com" rel="preconnect" />
      <link
        crossOrigin="anonymous"
        href="https://fonts.gstatic.com"
        rel="preconnect"
      />
      <link
        href="https://fonts.googleapis.com/css2?family=Inter:opsz@14..32&display=swap"
        rel="stylesheet"
      ></link>
      <Suspense fallback={<SuspenseFallback />}>
        <AppContextProvider>
          <AuthProvider authConfig={authConfig}>
            <QueryProvider>
              <Routes>
                <Route element={<Home />} index />
                <Route element={<Items />} path="/items" />
                <Route element={<Stashes />} path="/stashes" />
                <Route element={<Settings />} path="/settings" />
              </Routes>
            </QueryProvider>
          </AuthProvider>
        </AppContextProvider>
      </Suspense>
    </HashRouter>
  );
}
