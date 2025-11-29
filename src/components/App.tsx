import { lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { AuthProvider } from 'react-oauth2-code-pkce';
import { HashRouter, Route, Routes } from 'react-router-dom';

import SuspenseFallback from './SuspenseFallback';

import '../index.scss';

const Home = lazy(() => import('../pages/Home'));
const Stashes = lazy(() => import('../pages/Stashes'));
const Settings = lazy(() => import('../pages/Settings'));

const App = () => (
  <Suspense fallback={<SuspenseFallback />}>
    <AuthProvider
      authConfig={{
        clientId: 'stashr',
        authorizationEndpoint: 'https://www.pathofexile.com/oauth/authorize',
        tokenEndpoint: 'https://www.pathofexile.com/oauth/token',
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
  </Suspense>
);

const root = createRoot(document.getElementById('root'));

root.render(
  <HashRouter>
    <App />
  </HashRouter>
);
