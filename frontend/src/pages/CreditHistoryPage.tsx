import { useEffect, useState } from 'react';
import { History } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageLayout } from '../components/layout/PageLayout';
import { Notice } from '../components/ui/Notice';
import { StateMessage } from '../components/ui/StateMessage';
import { DEMO_CREDIT_HISTORY } from '../data/demo';
import { api } from '../lib/api';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { formatShortDate } from '../lib/format';

const amountLabels: Record<string, string> = {
  grant: 'Entrada',
  consume: 'Saída',
  refund: 'Entrada',
  adjust: 'Ajuste',
};

export function CreditHistoryPage() {
  useDocumentTitle('Histórico de créditos');
  const [real, setReal] = useState<readonly {id:string;reason:string;amount:number;created_at:string}[] | null>(null);
  useEffect(() => {
    if (typeof fetch !== 'function') return;
    let mounted = true;
    void api<{movements:{id:string;reason:string;amount:number;created_at:string}[]}>('/api/credits/history')
      .then((data) => { if (mounted) setReal(data.movements); })
      .catch(() => undefined);
    return () => { mounted = false; };
  }, []);

  return (
    <PageLayout>
      <div className="page">
        <div className="container page-stack">
          <header className="page__header">
            <p className="eyebrow">Créditos</p>
            <h1>Histórico de créditos</h1>
            <p className="lead">
              Movimentações da sua conta, sem nenhum dado dos documentos processados.
            </p>
          </header>

          {real === null ? <Notice tone="demo" title="Demonstração de interface">
            As movimentações abaixo são fictícias. <Link to="/entrar">Entre na conta</Link> para consultar o histórico real.
          </Notice> : <Notice tone="info">Exibindo somente lançamentos operacionais da sua conta.</Notice>}

          {(real !== null ? real.length === 0 : DEMO_CREDIT_HISTORY.length === 0) ? (
            <StateMessage title="Você ainda não tem movimentações.">
              <p>Quando houver uma concessão, uso ou estorno, ela aparecerá aqui.</p>
            </StateMessage>
          ) : (
            <ul className="history-list">
              {(real !== null ? real.map((movement) => ({
                id: movement.id, kind: movement.reason, label: ({test_grant:'Concessão de teste', consume:'Uso em um processo', refund:'Estorno', adjust:'Ajuste'} as Record<string,string>)[movement.reason] ?? 'Movimentação',
                date: movement.created_at, amount: movement.amount, reference: 'Registro financeiro', icon: History,
              })) : DEMO_CREDIT_HISTORY).map((movement) => {
                const Icon = movement.icon;
                const isCredit = movement.amount > 0;

                return (
                  <li className="history-item" key={movement.id}>
                    <span className="history-item__icon" aria-hidden="true">
                      <Icon />
                    </span>
                    <div className="history-item__info">
                      <span className="history-item__type">{movement.label}</span>
                      <span className="history-item__meta">
                        {formatShortDate(movement.date)} · {movement.reference}
                      </span>
                    </div>
                    <span
                      className={`history-item__amount${isCredit ? ' history-item__amount--in' : ''}`}
                    >
                      <span className="sr-only">
                        {amountLabels[movement.kind] ?? 'Movimentação'} de{' '}
                      </span>
                      {movement.amount > 0 ? `+${movement.amount}` : `−${Math.abs(movement.amount)}`}
                      <span className="sr-only">
                        {' '}
                        {Math.abs(movement.amount) === 1 ? 'crédito' : 'créditos'}
                      </span>
                    </span>
                  </li>
                );
              })}
            </ul>
          )}

          <p className="history-note">
            Apenas data, tipo, quantidade e referência financeira não sensível são exibidos.
          </p>

          <div>
            <Link className="action-link" to="/creditos">
              <span className="icon-badge" aria-hidden="true">
                <History />
              </span>
              <span className="action-link__text">
                <span>Voltar para créditos</span>
                <span className="action-link__hint">Entenda como o crédito é usado</span>
              </span>
            </Link>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
