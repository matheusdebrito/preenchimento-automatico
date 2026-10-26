import { lazy, Suspense } from 'react';
import { LoaderCircle } from 'lucide-react';
import { Route, Routes } from 'react-router-dom';
import { HomePage } from './pages/HomePage';

const AccountPage = lazy(() =>
  import('./pages/AccountPage').then((module) => ({ default: module.AccountPage })),
);
const CreditsPage = lazy(() =>
  import('./pages/CreditsPage').then((module) => ({ default: module.CreditsPage })),
);
const CreditHistoryPage = lazy(() =>
  import('./pages/CreditHistoryPage').then((module) => ({ default: module.CreditHistoryPage })),
);
const NotFoundPage = lazy(() =>
  import('./pages/NotFoundPage').then((module) => ({ default: module.NotFoundPage })),
);
const WizardRoute = lazy(() =>
  import('./features/wizard/WizardRoute').then((module) => ({ default: module.WizardRoute })),
);

function RouteLoading() {
  return (
    <div className="route-loading" role="status" aria-live="polite">
      <LoaderCircle aria-hidden="true" />
      <span>Carregando…</span>
    </div>
  );
}

export function App() {
  return (
    <Suspense fallback={<RouteLoading />}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/minha-conta" element={<AccountPage />} />
        <Route path="/creditos" element={<CreditsPage />} />
        <Route path="/creditos/historico" element={<CreditHistoryPage />} />
        <Route path="/preencher/*" element={<WizardRoute />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
