import { Compass } from 'lucide-react';
import { PageLayout } from '../components/layout/PageLayout';
import { Button } from '../components/ui/Button';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export function NotFoundPage() {
  useDocumentTitle('Página não encontrada');

  return (
    <PageLayout>
      <div className="container not-found">
        <div className="not-found__inner">
          <span className="state__icon" aria-hidden="true">
            <Compass />
          </span>
          <p className="not-found__code">Erro 404</p>
          <h1>Página não encontrada</h1>
          <p>
            O endereço pode ter mudado ou a página ainda não existe. Volte ao início para escolher
            um serviço.
          </p>
          <div className="not-found__actions">
            <Button to="/">Ir para o início</Button>
            <Button to="/minha-conta" variant="secondary">
              Minha conta
            </Button>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
