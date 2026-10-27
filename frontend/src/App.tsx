import { lazy, Suspense } from 'react';
import { LoaderCircle } from 'lucide-react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { AuthProvider } from './features/auth/AuthProvider';

const AuthPage = lazy(() => import('./pages/AuthPage').then((module) => ({ default: module.AuthPage })));
const LiveFlowPage = lazy(() => import('./features/real/LiveFlowPage').then((module) => ({ default: module.LiveFlowPage })));

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
    <AuthProvider>
      <Suspense fallback={<RouteLoading />}>
        <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/entrar" element={<AuthPage />} />
        <Route path="/preencher-real/:serviceId" element={<LiveFlowPage />} />
        <Route path="/minha-conta" element={<AccountPage />} />
        <Route path="/creditos" element={<CreditsPage />} />
        <Route path="/creditos/historico" element={<CreditHistoryPage />} />
        <Route path="/preencher/*" element={<Navigate to="/" replace />} />
        <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </AuthProvider>
  );
}
