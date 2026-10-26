import { ArrowRight, ChevronRight, ShieldCheck, ShipWheel, Waves } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AppFooter } from '../components/layout/AppFooter';
import { AppHeader } from '../components/layout/AppHeader';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { SERVICE_CATEGORIES } from '../data/catalog';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export function HomePage() {
  useDocumentTitle();

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

                if (!category.available) {
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
                        <span className="category-card__available">Fluxo disponível</span>
                      </div>
                    </div>
                    <ChevronRight className="category-card__chevron" aria-hidden="true" />
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

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
                  Nesta demonstração, as fotos e os arquivos que você escolher permanecem no seu
                  navegador e não são enviados para nenhum servidor.
                </p>
                <p className="trust-card__note">
                  Quando o processamento estiver disponível, o prazo de retenção e a política de
                  exclusão serão exibidos antes de qualquer envio.
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
