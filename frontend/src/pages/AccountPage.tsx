import { useEffect, useState } from 'react';
import { ArrowRight, FilePlus2, History, ShieldCheck, UserRound, Wallet } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageLayout } from '../components/layout/PageLayout';
import { Notice } from '../components/ui/Notice';
import { DEMO_CREDIT_BALANCE } from '../data/demo';
import { api } from '../lib/api';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useAuth } from '../features/auth/AuthProvider';

function formatCellphone(value: string | null): string {
  if (!value) return 'Não informado';
  const digits = value.replace(/\D/g, '');
  const national = digits.startsWith('55') ? digits.slice(2) : digits;
  if (national.length !== 11) return value;
  return `(${national.slice(0, 2)}) ${national.slice(2, 7)}-${national.slice(7)}`;
}

export function AccountPage() {
  useDocumentTitle('Minha conta');
  const { session } = useAuth();
  const user = session.status === 'authenticated' ? session.user : null;
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    if (!user || typeof fetch !== 'function') return;
    let mounted = true;
    void api<{balance:number}>('/api/credits/balance')
      .then((credits) => {
        if (mounted) setBalance(credits.balance);
      })
      .catch(() => undefined);
    return () => { mounted = false; };
  }, [user]);

  return (
    <PageLayout>
      <div className="page">
        <div className="container page-stack">
          <header className="page__header">
            <p className="eyebrow">Minha conta</p>
            <h1>{user?.fullName ?? (user ? 'Sua conta' : 'Bem-vindo!')}</h1>
            <p className="lead">
              {user ? user.email : 'Acompanhe seus créditos e comece um novo preenchimento quando precisar.'}
            </p>
          </header>

          {!user ? <Notice tone="demo" title="Prévia de interface">
            O saldo abaixo é apenas ilustrativo. <Link to="/entrar">Entre na conta</Link> para ver seu saldo real.
          </Notice> : <Notice tone="success">Saldo carregado da sua conta. A venda de créditos ainda não foi ativada.</Notice>}

          {user ? (
            <section className="account-panel" aria-labelledby="profile-title">
              <div className="account-profile-title">
                <span className="icon-badge" aria-hidden="true"><UserRound /></span>
                <div>
                  <h2 className="account-panel__title" id="profile-title">Dados da conta</h2>
                  <p className="account-panel__text">Informações cadastradas para identificação e contato.</p>
                </div>
              </div>
              <dl className="account-profile-grid">
                <div><dt>Nome</dt><dd>{user.fullName ?? 'Cadastro antigo — não informado'}</dd></div>
                <div><dt>E-mail</dt><dd>{user.email}</dd></div>
                <div><dt>Celular</dt><dd>{formatCellphone(user.cellphone)}</dd></div>
                <div><dt>CPF</dt><dd>{user.cpfMasked ?? 'Cadastro antigo — não informado'}</dd></div>
                <div><dt>Status</dt><dd>{user.status === 'ACTIVE' ? 'Ativa' : user.status}</dd></div>
                <div><dt>Perfil</dt><dd>{user.role === 'ADMIN' ? 'Administrador' : 'Usuário'}</dd></div>
              </dl>
            </section>
          ) : null}

          <div className="account-layout">
            <section className="credit-balance" aria-labelledby="balance-title">
              <div className="credit-balance__top">
                <div>
                  <h2 className="credit-balance__label" id="balance-title">
                    Seus créditos
                  </h2>
                  <p className="credit-balance__number">{balance ?? DEMO_CREDIT_BALANCE}</p>
                  <p className="credit-balance__caption">processos disponíveis</p>
                </div>
                <span className="credit-balance__icon" aria-hidden="true">
                  <Wallet />
                </span>
              </div>
              <p className="credit-balance__badge-row">
                <span className="badge badge--test">{user ? 'Saldo da conta' : 'Créditos fictícios'}</span>
                <span>{user ? 'Movimentações registradas no servidor.' : 'Saldo ilustrativo de demonstração.'}</span>
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
            O CPF é exibido de forma mascarada. Dados de documentos processados continuam fora
            do histórico operacional da conta.
          </Notice>
        </div>
      </div>
    </PageLayout>
  );
}
