import { ArrowRight, FilePlus2, History, ShieldCheck, Wallet } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageLayout } from '../components/layout/PageLayout';
import { Notice } from '../components/ui/Notice';
import { DEMO_CREDIT_BALANCE } from '../data/demo';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export function AccountPage() {
  useDocumentTitle('Minha conta');

  return (
    <PageLayout>
      <div className="page">
        <div className="container page-stack">
          <header className="page__header">
            <p className="eyebrow">Minha conta</p>
            <h1>Bem-vindo!</h1>
            <p className="lead">
              Acompanhe seus créditos e comece um novo preenchimento quando precisar.
            </p>
          </header>

          <Notice tone="demo" title="Demonstração de interface">
            O saldo, o histórico e as ações desta tela são ilustrativos. A autenticação e o saldo
            real serão conectados ao servidor nas próximas etapas.
          </Notice>

          <div className="account-layout">
            <section className="credit-balance" aria-labelledby="balance-title">
              <div className="credit-balance__top">
                <div>
                  <h2 className="credit-balance__label" id="balance-title">
                    Seus créditos
                  </h2>
                  <p className="credit-balance__number">{DEMO_CREDIT_BALANCE}</p>
                  <p className="credit-balance__caption">processos disponíveis</p>
                </div>
                <span className="credit-balance__icon" aria-hidden="true">
                  <Wallet />
                </span>
              </div>
              <p className="credit-balance__badge-row">
                <span className="badge badge--test">Créditos de teste</span>
                <span>Saldo ilustrativo de demonstração.</span>
              </p>
            </section>

            <section className="account-panel" aria-labelledby="actions-title">
              <h2 className="account-panel__title" id="actions-title">
                O que você pode fazer
              </h2>
              <div className="action-list">
                <Link className="action-link" to="/preencher/servico">
                  <span className="icon-badge" aria-hidden="true">
                    <FilePlus2 />
                  </span>
                  <span className="action-link__text">
                    <span>Preencher documentos</span>
                    <span className="action-link__hint">Comece um novo processo</span>
                  </span>
                  <ArrowRight className="action-link__arrow" aria-hidden="true" />
                </Link>

                <Link className="action-link" to="/creditos/historico">
                  <span className="icon-badge" aria-hidden="true">
                    <History />
                  </span>
                  <span className="action-link__text">
                    <span>Histórico de créditos</span>
                    <span className="action-link__hint">Veja concessões, usos e estornos</span>
                  </span>
                  <ArrowRight className="action-link__arrow" aria-hidden="true" />
                </Link>

                <Link className="action-link" to="/creditos">
                  <span className="icon-badge" aria-hidden="true">
                    <Wallet />
                  </span>
                  <span className="action-link__text">
                    <span>Entender os créditos</span>
                    <span className="action-link__hint">1 crédito por processo, sem mensalidade</span>
                  </span>
                  <ArrowRight className="action-link__arrow" aria-hidden="true" />
                </Link>
              </div>
            </section>
          </div>

          <Notice
            tone="info"
            icon={<ShieldCheck aria-hidden="true" />}
            title="Privacidade por padrão"
          >
            O histórico guarda apenas dados operacionais de créditos. Nenhum dado dos documentos
            processados aparece aqui.
          </Notice>
        </div>
      </div>
    </PageLayout>
  );
}
