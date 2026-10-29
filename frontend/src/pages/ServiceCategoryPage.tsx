import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { AppFooter } from '../components/layout/AppFooter';
import { AppHeader } from '../components/layout/AppHeader';
import { Badge } from '../components/ui/Badge';
import { PLANNED_AMATEUR_SERVICES, PLANNED_VESSEL_SERVICES, SERVICE_CATEGORIES } from '../data/catalog';
import { api } from '../lib/api';
import type { LiveService } from '../lib/api';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export function ServiceCategoryPage() {
  const { categoryId } = useParams();
  const category = SERVICE_CATEGORIES.find((item) => item.id === categoryId);
  const [available, setAvailable] = useState<readonly LiveService[]>([]);
  const [availabilityState, setAvailabilityState] = useState<'loading' | 'ready' | 'error'>('loading');

  useDocumentTitle(category ? category.title : 'Serviços');

  useEffect(() => {
    if (!category || typeof fetch !== 'function') return;
    let mounted = true;
    setAvailabilityState('loading');
    void api<{services:LiveService[]}>('/api/services').then((result) => {
      if (!mounted) return;
      setAvailable(result.services);
      setAvailabilityState('ready');
    }).catch(() => {
      if (mounted) setAvailabilityState('error');
    });
    return () => { mounted = false; };
  }, [category]);

  const planned = useMemo(() => {
    if (categoryId === 'embarcacoes') return PLANNED_VESSEL_SERVICES;
    if (categoryId === 'amadores') return PLANNED_AMATEUR_SERVICES;
    return [];
  }, [categoryId]);

  const availableById = useMemo(
    () => new Map(available.map((service) => [service.id, service])),
    [available],
  );

  if (!category) {
    return (
      <div className="app-shell">
        <AppHeader />
        <main id="conteudo" className="app-main">
          <section className="home-section">
            <div className="container">
              <div className="section-heading">
                <p className="eyebrow">Serviços</p>
                <h1>Categoria não encontrada</h1>
                <p>Escolha uma categoria válida para continuar.</p>
              </div>
              <Link className="btn btn--secondary" to="/">Voltar ao início</Link>
            </div>
          </section>
        </main>
        <AppFooter />
      </div>
    );
  }

  const Icon = category.icon;

  return (
    <div className="app-shell">
      <a className="skip-link" href="#conteudo">Pular para o conteúdo</a>
      <AppHeader />

      <main id="conteudo" className="app-main" tabIndex={-1}>
        <section className="home-section service-category-page" aria-labelledby="service-category-title">
          <div className="container">
            <Link className="service-category-back" to="/">
              <ChevronLeft aria-hidden="true" />
              Voltar às categorias
            </Link>

            <div className="section-heading service-category-heading">
              <span className="icon-badge icon-badge--lg" aria-hidden="true"><Icon /></span>
              <p className="eyebrow">Serviços</p>
              <h1 id="service-category-title">{category.title}</h1>
              <p>{category.description}</p>
            </div>

            {planned.length === 0 ? (
              <div className="card card--padded service-category-empty">
                <h2>Serviços em preparação</h2>
                <p>
                  Esta categoria já está organizada na aplicação, mas ainda não há serviços
                  cadastrados para preenchimento. Eles serão adicionados aqui conforme forem
                  homologados.
                </p>
              </div>
            ) : (
              <div className="category-grid" aria-label={'Serviços de ' + category.title}>
                {planned.map((service) => {
                  const live = availableById.get(service.id);
                  if (!live) {
                    const unavailableLabel = availabilityState === 'loading'
                      ? 'Verificando disponibilidade'
                      : availabilityState === 'error'
                        ? 'Disponibilidade indisponível'
                        : 'Formulário em validação';
                    return (
                      <article key={service.id} className="category-card category-card--soon">
                        <span className="icon-badge" aria-hidden="true"><Icon /></span>
                        <div className="category-card__content">
                          <h2 className="category-card__title">{service.title}</h2>
                          <p className="category-card__description">{service.summary}</p>
                          <div className="category-card__meta">
                            <Badge tone="soon">{unavailableLabel}</Badge>
                          </div>
                        </div>
                      </article>
                    );
                  }

                  return (
                    <Link
                      key={service.id}
                      className="category-card category-card--link"
                      to={'/preencher-real/' + encodeURIComponent(live.id)}
                    >
                      <span className="icon-badge" aria-hidden="true"><Icon /></span>
                      <div className="category-card__content">
                        <h2 className="category-card__title">{live.title}</h2>
                        <p className="category-card__description">{service.summary}</p>
                        <div className="category-card__meta">
                          <span className="category-card__available">
                            Preencher — {live.creditCost} crédito
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="category-card__chevron" aria-hidden="true" />
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </main>

      <AppFooter />
    </div>
  );
}
