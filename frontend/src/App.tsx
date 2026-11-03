import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { AuthProvider } from './features/auth/AuthProvider';

const AuthPage = lazy(() => import('./pages/AuthPage').then((module) => ({ default: module.AuthPage })));
const LiveFlowPage = lazy(() => import('./features/real/LiveFlowPage').then((module) => ({ default: module.LiveFlowPage })));
const ServiceCategoryPage = lazy(() =>
  import('./pages/ServiceCategoryPage').then((module) => ({ default: module.ServiceCategoryPage })),
);

const AccountPage = lazy(() =>
  import('./pages/AccountPage').then((module) => ({ default: module.AccountPage })),
);
const AdminPage = lazy(() =>
  import('./pages/AdminPage').then((module) => ({ default: module.AdminPage })),
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
    <main className="container page-stack" role="status" aria-label="Carregando página">
      <section className="card card--padded skeleton-stack" aria-hidden="true">
        <span className="skeleton-line skeleton-line--short" />
        <span className="skeleton-line skeleton-line--wide" />
        <span className="skeleton-line" />
        <span className="skeleton-block" />
      </section>
      <span className="sr-only">Carregando página…</span>
    </main>
  );
}

export function App() {
  return (
    <AuthProvider>
      <Suspense fallback={<RouteLoading />}>
        <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/entrar" element={<AuthPage />} />
        <Route path="/servicos/:categoryId" element={<ServiceCategoryPage />} />
        <Route path="/preencher-real/:serviceId" element={<LiveFlowPage />} />
        <Route path="/minha-conta" element={<AccountPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/creditos" element={<CreditsPage />} />
        <Route path="/creditos/historico" element={<CreditHistoryPage />} />
        <Route path="/preencher/*" element={<Navigate to="/" replace />} />
        <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </AuthProvider>
  );
}
