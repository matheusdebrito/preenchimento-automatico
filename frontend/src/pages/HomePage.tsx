import { useEffect, useState } from 'react';
import { ArrowRight, ChevronRight, ShieldCheck, ShipWheel, Waves } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AppFooter } from '../components/layout/AppFooter';
import { AppHeader } from '../components/layout/AppHeader';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { SERVICE_CATEGORIES } from '../data/catalog';
import { api } from '../lib/api';
import type { LiveService } from '../lib/api';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export function HomePage() {
  useDocumentTitle();
  const [available, setAvailable] = useState<readonly LiveService[]>([]);
  const qaAvailable = available.filter((service) => service.id === 'transferencia-moto-aquatica' && service.creditCost === 0);
  const officialAvailable = available.filter((service) => !(service.id === 'transferencia-moto-aquatica' && service.creditCost === 0));
  useEffect(() => {
    if (typeof fetch !== 'function') return;
    let mounted = true;
    void api<{services:LiveService[]}>('/api/services').then((result) => {
      if (mounted) setAvailable(result.services);
    }).catch(() => undefined);
    return () => { mounted = false; };
  }, []);

  return (
    <div className="app-shell">
      <a className="skip-link" href="#conteudo">
        Pular para o conteúdo
      </a>

      <div className="home-hero">
        <AppHeader variant="hero" />

        <section className="hero" aria-labelledby="hero-title">
          <div className="container">
            <div className="hero__inner">
              <p className="hero__eyebrow">
                <ShipWheel aria-hidden="true" />
                Serviços náuticos
              </p>
              <h1 id="hero-title">Documentos da Marinha sem complicação.</h1>
              <p className="hero__subtitle">
                Escolha o serviço, envie as fotos dos documentos e receba os formulários
                preenchidos.
              </p>
              <div className="hero__actions">
                <Button
                  to="/preencher/servico"
                  variant="inverse"
                  size="lg"
                  icon={<ArrowRight aria-hidden="true" />}
                  iconPosition="end"
                >
                  Começar agora
                </Button>
                <span className="hero__note">
                  <ShieldCheck aria-hidden="true" />
                  Você confere tudo antes de gerar
                </span>
              </div>
            </div>
          </div>
          <Waves className="hero__waves" aria-hidden="true" strokeWidth={1.5} />
        </section>
      </div>

      <main id="conteudo" className="app-main" tabIndex={-1}>
        <section className="home-section" aria-labelledby="categories-title">
          <div className="container">
            <div className="section-heading">
              <p className="eyebrow">Escolha um caminho</p>
              <h2 id="categories-title">O que você deseja fazer?</h2>
              <p>
                Comece pelo serviço. Os demais caminhos serão liberados depois da validação de cada
                fluxo.
              </p>
            </div>

            <div className="category-grid">
              {SERVICE_CATEGORIES.map((category) => {
                const Icon = category.icon;

                if (!category.demoAvailable) {
                  return (
                    <article key={category.id} className="category-card category-card--soon">
                      <span className="icon-badge" aria-hidden="true">
                        <Icon />
                      </span>
                      <div className="category-card__content">
                        <h3 className="category-card__title">{category.title}</h3>
                        <p className="category-card__description">{category.description}</p>
                        <div className="category-card__meta">
                          <Badge tone="soon">Em breve</Badge>
                        </div>
                      </div>
                    </article>
                  );
                }

                return (
                  <Link
                    key={category.id}
                    className="category-card category-card--link"
                    to="/preencher/servico"
                  >
                    <span className="icon-badge" aria-hidden="true">
                      <Icon />
                    </span>
                    <div className="category-card__content">
                      <h3 className="category-card__title">{category.title}</h3>
                      <p className="category-card__description">{category.description}</p>
                      <div className="category-card__meta">
                        <span className="category-card__available">Demonstração disponível</span>
                      </div>
                    </div>
                    <ChevronRight className="category-card__chevron" aria-hidden="true" />
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {qaAvailable.length ? (
          <section className="home-section home-section--flush-top" aria-labelledby="qa-title">
            <div className="container">
              <div className="section-heading">
                <p className="eyebrow">Apenas ambiente local</p>
                <h2 id="qa-title">Teste técnico com dados fictícios</h2>
                <p>Mesmo serviço de transferência, com perguntas e campos dos formulários originais, testado com fotos, OCR, revisão e PDFs marcados como AMOSTRA.
                  Não use documentos reais. Este teste não é serviço homologado.</p>
              </div>
              <div className="category-grid">
                {qaAvailable.map((service) => (
                  <Link key={service.id} className="category-card category-card--link"
                    to={"/preencher-real/" + encodeURIComponent(service.id)}>
                    <span className="category-card__content">
                      <strong className="category-card__title">{service.title}</strong>
                      <span className="category-card__description">{service.description}</span>
                      <span className="category-card__available">Testar com fotos fictícias — sem créditos</span>
                    </span>
                    <ChevronRight aria-hidden="true" />
                  </Link>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {officialAvailable.length ? (
          <section className="home-section home-section--flush-top" aria-labelledby="ready-title">
            <div className="container">
              <div className="section-heading">
                <h2 id="ready-title">Serviços homologados</h2>
                <p>Modelos oficiais verificados, com preenchimento e conferência dos dados.</p>
              </div>
              <div className="category-grid">
                {officialAvailable.map((service) => <Link key={service.id} className="category-card category-card--link"
                  to={"/preencher-real/" + encodeURIComponent(service.id)}>
                  <span className="category-card__content">
                    <strong className="category-card__title">{service.title}</strong>
                    <span className="category-card__description">{service.description}</span>
                    <span className="category-card__available">Preencher — {service.creditCost} crédito</span>
                  </span>
                  <ChevronRight aria-hidden="true" />
                </Link>)}
              </div>
            </div>
          </section>
        ) : null}

        <section className="home-section home-section--flush-top" aria-labelledby="how-title">
          <div className="container">
            <div className="section-heading">
              <p className="eyebrow">Simples do início ao fim</p>
              <h2 id="how-title">Como funciona</h2>
            </div>
            <ol className="how-list">
              <li className="how-item">
                <span className="how-item__number" aria-hidden="true">
                  1
                </span>
                <div>
                  <h3 className="how-item__title">Escolha o serviço</h3>
                  <p className="how-item__text">
                    Veja os documentos necessários e o custo em créditos.
                  </p>
                </div>
              </li>
              <li className="how-item">
                <span className="how-item__number" aria-hidden="true">
                  2
                </span>
                <div>
                  <h3 className="how-item__title">Envie as fotos</h3>
                  <p className="how-item__text">
                    Tire fotos ou escolha arquivos JPG, PNG ou PDF.
                  </p>
                </div>
              </li>
              <li className="how-item">
                <span className="how-item__number" aria-hidden="true">
                  3
                </span>
                <div>
                  <h3 className="how-item__title">Confira e baixe</h3>
                  <p className="how-item__text">
                    Revise os dados encontrados e prepare os formulários.
                  </p>
                </div>
              </li>
            </ol>
          </div>
        </section>

        <section className="home-section home-section--flush-top" aria-labelledby="trust-title">
          <div className="container">
            <div className="trust-card">
              <span className="icon-badge icon-badge--lg icon-badge--white" aria-hidden="true">
                <ShieldCheck />
              </span>
              <div className="trust-card__content">
                <h2 id="trust-title">Seus documentos ficam sob seu controle</h2>
                <p>
                  A demonstração visual funciona no navegador. No preenchimento assistido,
                  os arquivos enviados são processados temporariamente no servidor para
                  extrair os dados e gerar os formulários.
                </p>
                <p className="trust-card__note">
                  Os processos temporários podem ser apagados pelo usuário e expiram após
                  20 minutos, com renovação limitada a uma hora. Revise cada dado antes de gerar.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <AppFooter />
    </div>
  );
}
