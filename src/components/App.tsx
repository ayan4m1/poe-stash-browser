import { lazy, Suspense } from 'react';
import { Container } from 'react-bootstrap';
import { createRoot } from 'react-dom/client';
import { HashRouter, Route, Routes } from 'react-router-dom';

import SuspenseFallback from './SuspenseFallback';

import '../index.scss';

const Home = lazy(() => import('../pages/Home'));

const App = () => (
  <Suspense fallback={<SuspenseFallback />}>
    <Container>
      <Routes>
        <Route element={<Home />} index />
      </Routes>
    </Container>
  </Suspense>
);

const root = createRoot(document.getElementById('root'));

root.render(
  <HashRouter>
    <App />
  </HashRouter>
);
