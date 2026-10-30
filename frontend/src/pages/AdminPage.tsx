import { useCallback, useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Activity, Coins, Search, ShieldCheck, Users } from 'lucide-react';
import { PageLayout } from '../components/layout/PageLayout';
import { Button } from '../components/ui/Button';
import { Notice } from '../components/ui/Notice';
import { api, ApiError } from '../lib/api';
import { useAuth } from '../features/auth/AuthProvider';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

type UserStatus = 'ACTIVE' | 'BLOCKED' | 'PENDING';
type UserRole = 'USER' | 'ADMIN';
type UsagePeriod = 'today' | '7d' | 'month' | 'year';

interface Dashboard {
  users: { total:number; active:number; blocked:number; pending:number };
  credits: {
    usedToday:number;
    usedWeek:number;
    usedMonth:number;
    grantedMonth:number;
    totalBalance:number;
  };
}

interface UsageMetrics {
  period: UsagePeriod;
  creditsUsed: number;
  inputTokens: number;
  outputTokens: number;
  points: Array<{
    bucket:string;
    label:string;
    creditsUsed:number;
    inputTokens:number;
    outputTokens:number;
  }>;
}

interface AdminUser {
  id:string;
  email:string;
  fullName:string|null;
  cellphone:string|null;
  cpfMasked:string|null;
  status:UserStatus;
  role:UserRole;
  createdAt:string;
  balance:number;
  creditsUsed:number;
  lastCreditAt:string|null;
}

interface UserDetail {
  user: Omit<AdminUser, 'lastCreditAt'>;
  movements: Array<{id:string;reason:string;amount:number;createdAt:string}>;
}

interface AuditEntry {
  id:string;
  action:string;
  metadata:Record<string,unknown>;
  createdAt:string;
  admin:{id:string;name:string|null;email:string};
  target:{id:string;name:string|null;email:string}|null;
}

function formatCellphone(value: string | null): string {
  if (!value) return '—';
  const national = value.startsWith('55') ? value.slice(2) : value;
  return national.length === 11
    ? `(${national.slice(0,2)}) ${national.slice(2,7)}-${national.slice(7)}`
    : value;
}

function formatDate(value: string | null): string {
  if (!value) return '—';
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
}

function actionLabel(action: string): string {
  if (action === 'CREDIT_GRANT') return 'Créditos concedidos';
  if (action === 'STATUS_CHANGE') return 'Status alterado';
  if (action === 'ROLE_CHANGE') return 'Perfil alterado';
  return action;
}


async function readAdminPage(
  page: number,
  query: string,
  status: string,
  role: string,
): Promise<{
  dashboard: Dashboard;
  audit: AuditEntry[];
  users: AdminUser[];
  totalUsers: number;
}> {
  const params = new URLSearchParams({ page: String(page), pageSize: '50' });
  if (query.trim()) params.set('q', query.trim());
  if (status) params.set('status', status);
  if (role) params.set('role', role);
  const [dashboard, auditResult, usersResult] = await Promise.all([
    api<Dashboard>('/api/admin/dashboard'),
    api<{entries:AuditEntry[]}>('/api/admin/audit?limit=50'),
    api<{users:AdminUser[];total:number}>('/api/admin/users?' + params),
  ]);
  return {
    dashboard,
    audit: auditResult.entries,
    users: usersResult.users,
    totalUsers: usersResult.total,
  };
}

function periodLabel(period: UsagePeriod): string {
  if (period === 'today') return 'Hoje';
  if (period === '7d') return 'Últimos 7 dias';
  if (period === 'month') return 'Mês';
  return 'Ano';
}

function compactNumber(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    notation: value >= 1000 ? 'compact' : 'standard',
    maximumFractionDigits: 1,
  }).format(value);
}

function showChartTick(period: UsagePeriod, index: number, total: number): boolean {
  if (total <= 8 || period === '7d' || period === 'year') return true;
  if (period === 'today') return index % 3 === 0 || index === total - 1;
  return index % 5 === 0 || index === total - 1;
}

async function readAdminUsage(period: UsagePeriod): Promise<UsageMetrics> {
  return api<UsageMetrics>('/api/admin/usage?period=' + encodeURIComponent(period));
}

export function AdminPage() {
  useDocumentTitle('Administração');
  const { session } = useAuth();
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [usagePeriod, setUsagePeriod] = useState<UsagePeriod>('7d');
  const [usage, setUsage] = useState<UsageMetrics | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [page, setPage] = useState(1);
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [selected, setSelected] = useState<UserDetail | null>(null);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [appliedQuery, setAppliedQuery] = useState('');
  const [appliedStatus, setAppliedStatus] = useState('');
  const [appliedRole, setAppliedRole] = useState('');
  const [creditAmount, setCreditAmount] = useState('10');
  const [busyAction, setBusyAction] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const currentUser = session.status === 'authenticated' ? session.user : null;

  const loadSelected = useCallback(async (userId: string) => {
    setSelected(await api<UserDetail>('/api/admin/users/' + userId));
  }, []);

  const refreshAll = useCallback(async (selectedUserId?: string) => {
    const data = await readAdminPage(page, appliedQuery, appliedStatus, appliedRole);
    setDashboard(data.dashboard);
    setAudit(data.audit);
    setUsers(data.users);
    setTotalUsers(data.totalUsers);
    if (selectedUserId) {
      setSelected(await api<UserDetail>('/api/admin/users/' + selectedUserId));
    }
  }, [appliedQuery, appliedRole, appliedStatus, page]);

  useEffect(() => {
    if (!currentUser || currentUser.role !== 'ADMIN') return;
    let active = true;
    void readAdminPage(page, appliedQuery, appliedStatus, appliedRole)
      .then((data) => {
        if (!active) return;
        setDashboard(data.dashboard);
        setAudit(data.audit);
        setUsers(data.users);
        setTotalUsers(data.totalUsers);
      })
      .catch((cause) => {
        if (!active) return;
        setError(cause instanceof ApiError && cause.status === 403
          ? 'Sua conta não possui permissão administrativa.'
          : 'Não foi possível carregar o painel administrativo.');
      });
    return () => { active = false; };
  }, [appliedQuery, appliedRole, appliedStatus, currentUser, page]);

  useEffect(() => {
    if (!currentUser || currentUser.role !== 'ADMIN') return;
    let active = true;
    void readAdminUsage(usagePeriod)
      .then((data) => {
        if (active) setUsage(data);
      })
      .catch(() => {
        if (active) setError('Não foi possível carregar as métricas de uso.');
      });
    return () => { active = false; };
  }, [currentUser, usagePeriod]);

  const maxCredits = useMemo(
    () => Math.max(1, ...(usage?.points.map((item) => item.creditsUsed) ?? [1])),
    [usage],
  );
  const maxTokens = useMemo(
    () => Math.max(1, ...(usage?.points.flatMap((item) => [
      item.inputTokens, item.outputTokens,
    ]) ?? [1])),
    [usage],
  );

  if (session.status === 'loading') {
    return <PageLayout><div className="page"><div className="container">
      <Notice tone="info">Verificando sua sessão…</Notice>
    </div></div></PageLayout>;
  }
  if (!currentUser) return <Navigate to="/entrar" replace />;
  if (currentUser.role !== 'ADMIN') return <Navigate to="/minha-conta" replace />;

  const mutate = async (work: () => Promise<unknown>, successMessage: string) => {
    if (busyAction) return;
    setBusyAction(true);
    setError('');
    setSuccess('');
    try {
      await work();
      await refreshAll(selected?.user.id);
      setSuccess(successMessage);
    } catch (cause) {
      setError(cause instanceof ApiError
        ? cause.message
        : 'Não foi possível concluir a ação administrativa.');
    } finally {
      setBusyAction(false);
    }
  };

  const grantCredits = () => {
    if (!selected) return;
    const amount = Number(creditAmount);
    if (!Number.isInteger(amount) || amount < 1 || amount > 1000) {
      setError('Informe entre 1 e 1000 créditos.');
      return;
    }
    const idempotencyKey = 'admin-grant-' + crypto.randomUUID();
    void mutate(
      () => api('/api/admin/users/' + selected.user.id + '/credits', {
        method: 'POST',
        headers: { 'Idempotency-Key': idempotencyKey },
        body: JSON.stringify({ amount }),
      }),
      `${amount} crédito(s) adicionados com sucesso.`,
    );
  };

  return (
    <PageLayout>
      <div className="page admin-page">
        <div className="container page-stack">
          <header className="page__header">
            <p className="eyebrow">Administração</p>
            <h1>Painel administrativo</h1>
            <p className="lead">Usuários, créditos, permissões e auditoria em um único lugar.</p>
          </header>

          {error ? <Notice tone="danger" role="alert">{error}</Notice> : null}
          {success ? <Notice tone="success" role="status">{success}</Notice> : null}
          {!dashboard && !error ? <Notice tone="info">Carregando dados administrativos…</Notice> : null}

          {dashboard ? (
            <>
              <section className="admin-metrics" aria-label="Indicadores administrativos">
                <article className="admin-metric">
                  <Users aria-hidden="true" />
                  <span>Usuários</span>
                  <strong>{dashboard.users.total}</strong>
                  <small>{dashboard.users.active} ativos · {dashboard.users.blocked} bloqueados</small>
                </article>
                <article className="admin-metric">
                  <Activity aria-hidden="true" />
                  <span>Créditos usados hoje</span>
                  <strong>{dashboard.credits.usedToday}</strong>
                  <small>{dashboard.credits.usedWeek} na semana</small>
                </article>
                <article className="admin-metric">
                  <Coins aria-hidden="true" />
                  <span>Créditos usados no mês</span>
                  <strong>{dashboard.credits.usedMonth}</strong>
                  <small>{dashboard.credits.grantedMonth} concedidos por admin</small>
                </article>
                <article className="admin-metric">
                  <ShieldCheck aria-hidden="true" />
                  <span>Saldo total</span>
                  <strong>{dashboard.credits.totalBalance}</strong>
                  <small>créditos disponíveis nas contas</small>
                </article>
              </section>

              <section className="account-panel" aria-labelledby="usage-title">
                <div className="admin-section-head">
                  <div>
                    <h2 className="account-panel__title" id="usage-title">Uso da plataforma</h2>
                    <p className="account-panel__text">
                      Créditos consumidos e tokens OpenAI no período selecionado.
                    </p>
                  </div>
                  <div className="admin-period-tabs" role="group" aria-label="Período dos gráficos">
                    {([
                      ['today', 'Hoje'],
                      ['7d', 'Últimos 7 dias'],
                      ['month', 'Mês'],
                      ['year', 'Ano'],
                    ] as const).map(([value, label]) => (
                      <button key={value} type="button"
                        className={usagePeriod === value
                          ? 'admin-period-tab admin-period-tab--active'
                          : 'admin-period-tab'}
                        aria-pressed={usagePeriod === value}
                        onClick={() => setUsagePeriod(value)}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {usage ? (
                  <>
                    <div className="admin-token-summary">
                      <div>
                        <span>Tokens de entrada · {periodLabel(usage.period)}</span>
                        <strong>{usage.inputTokens.toLocaleString('pt-BR')}</strong>
                      </div>
                      <div>
                        <span>Tokens de saída · {periodLabel(usage.period)}</span>
                        <strong>{usage.outputTokens.toLocaleString('pt-BR')}</strong>
                      </div>
                    </div>

                    <div className="admin-chart-grid">
                      <section className="admin-chart-card" aria-labelledby="credits-chart-title">
                        <div className="admin-chart-card__head">
                          <div>
                            <h3 id="credits-chart-title">Créditos utilizados</h3>
                            <p>Consumo por {usage.period === 'today' ? 'hora' :
                              usage.period === 'year' ? 'mês' : 'dia'}</p>
                          </div>
                          <strong>{usage.creditsUsed.toLocaleString('pt-BR')}</strong>
                        </div>
                        <div className="admin-chart-shell">
                          <div className="admin-chart-y-axis" aria-hidden="true">
                            <span>{compactNumber(maxCredits)}</span>
                            <span>{compactNumber(Math.round(maxCredits / 2))}</span>
                            <span>0</span>
                          </div>
                          <div className="admin-column-chart" role="img"
                            aria-label={'Créditos utilizados — ' + periodLabel(usage.period)}>
                            <div className="admin-chart-gridlines" aria-hidden="true">
                              <i /><i /><i />
                            </div>
                            <div className="admin-chart-bars">
                              {usage.points.map((item, index) => (
                                <div className="admin-column-group" key={item.bucket}
                                  title={item.label + ': ' + item.creditsUsed + ' créditos'}>
                                  <div className="admin-column-track">
                                    <span className="admin-column admin-column--credits"
                                      style={{height: (item.creditsUsed / maxCredits * 100) + '%'}} />
                                  </div>
                                  <span className={showChartTick(usage.period, index, usage.points.length)
                                    ? 'admin-column-label'
                                    : 'admin-column-label admin-column-label--hidden'}>
                                    {item.label}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </section>

                      <section className="admin-chart-card" aria-labelledby="tokens-chart-title">
                        <div className="admin-chart-card__head">
                          <div>
                            <h3 id="tokens-chart-title">Tokens OpenAI</h3>
                            <p>Entrada e saída por {usage.period === 'today' ? 'hora' :
                              usage.period === 'year' ? 'mês' : 'dia'}</p>
                          </div>
                          <strong>{(usage.inputTokens + usage.outputTokens).toLocaleString('pt-BR')}</strong>
                        </div>
                        <div className="admin-chart-legend" aria-label="Legenda do gráfico de tokens">
                          <span><i className="admin-legend-input" /> Entrada</span>
                          <span><i className="admin-legend-output" /> Saída</span>
                        </div>
                        <div className="admin-chart-shell">
                          <div className="admin-chart-y-axis" aria-hidden="true">
                            <span>{compactNumber(maxTokens)}</span>
                            <span>{compactNumber(Math.round(maxTokens / 2))}</span>
                            <span>0</span>
                          </div>
                          <div className="admin-column-chart admin-column-chart--tokens" role="img"
                            aria-label={'Tokens OpenAI de entrada e saída — ' + periodLabel(usage.period)}>
                            <div className="admin-chart-gridlines" aria-hidden="true">
                              <i /><i /><i />
                            </div>
                            <div className="admin-chart-bars">
                              {usage.points.map((item, index) => (
                                <div className="admin-column-group" key={item.bucket}
                                  title={item.label + ': ' +
                                    item.inputTokens.toLocaleString('pt-BR') + ' entrada, ' +
                                    item.outputTokens.toLocaleString('pt-BR') + ' saída'}>
                                  <div className="admin-token-columns">
                                    <span className="admin-column admin-column--input"
                                      style={{height: (item.inputTokens / maxTokens * 100) + '%'}} />
                                    <span className="admin-column admin-column--output"
                                      style={{height: (item.outputTokens / maxTokens * 100) + '%'}} />
                                  </div>
                                  <span className={showChartTick(usage.period, index, usage.points.length)
                                    ? 'admin-column-label'
                                    : 'admin-column-label admin-column-label--hidden'}>
                                    {item.label}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </section>
                    </div>
                  </>
                ) : <Notice tone="info">Carregando métricas de uso…</Notice>}
              </section>
            </>
          ) : null}

          <section className="account-panel" aria-labelledby="users-title">
            <div className="admin-section-head">
              <div>
                <h2 className="account-panel__title" id="users-title">Usuários</h2>
                <p className="account-panel__text">{totalUsers} conta(s) encontrada(s).</p>
              </div>
            </div>
            <form className="admin-filters" onSubmit={(event) => {
              event.preventDefault();
              setAppliedQuery(query);
              setAppliedStatus(statusFilter);
              setAppliedRole(roleFilter);
              setPage(1);
            }}>
              <label className="field admin-search">
                <span className="field__label">Buscar</span>
                <span className="admin-search__control">
                  <Search aria-hidden="true" />
                  <input className="field__input" value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Nome, e-mail, CPF ou celular" />
                </span>
              </label>
              <label className="field">
                <span className="field__label">Status</span>
                <select className="field__input" value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}>
                  <option value="">Todos</option>
                  <option value="ACTIVE">Ativo</option>
                  <option value="BLOCKED">Bloqueado</option>
                  <option value="PENDING">Pendente</option>
                </select>
              </label>
              <label className="field">
                <span className="field__label">Perfil</span>
                <select className="field__input" value={roleFilter}
                  onChange={(event) => setRoleFilter(event.target.value)}>
                  <option value="">Todos</option>
                  <option value="USER">Usuário</option>
                  <option value="ADMIN">Administrador</option>
                </select>
              </label>
              <Button type="submit">Filtrar</Button>
            </form>

            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead><tr>
                  <th>Usuário</th><th>Status</th><th>Perfil</th>
                  <th>Saldo</th><th>Usados</th><th>Cadastro</th><th></th>
                </tr></thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td>
                        <strong>{user.fullName ?? 'Cadastro antigo'}</strong>
                        <span>{user.email}</span>
                      </td>
                      <td>{user.status}</td>
                      <td>{user.role}</td>
                      <td>{user.balance}</td>
                      <td>{user.creditsUsed}</td>
                      <td>{formatDate(user.createdAt)}</td>
                      <td><button className="live-text-button" type="button"
                        onClick={() => void loadSelected(user.id)}>Ver</button></td>
                    </tr>
                  ))}
                  {users.length === 0 ? (
                    <tr><td colSpan={7}>Nenhum usuário encontrado.</td></tr>
                  ) : null}
                </tbody>
              </table>
            </div>
            <div className="admin-pagination" aria-label="Paginação de usuários">
              <Button type="button" disabled={page <= 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}>
                Anterior
              </Button>
              <span>Página {page} de {Math.max(1, Math.ceil(totalUsers / 50))}</span>
              <Button type="button" disabled={page * 50 >= totalUsers}
                onClick={() => setPage((current) => current + 1)}>
                Próxima
              </Button>
            </div>
          </section>

          {selected ? (
            <section className="account-panel" aria-labelledby="detail-title">
              <div className="admin-section-head">
                <div>
                  <h2 className="account-panel__title" id="detail-title">
                    {selected.user.fullName ?? selected.user.email}
                  </h2>
                  <p className="account-panel__text">{selected.user.email}</p>
                </div>
                <button type="button" className="live-text-button" onClick={() => setSelected(null)}>
                  Fechar
                </button>
              </div>
              <dl className="account-profile-grid">
                <div><dt>CPF</dt><dd>{selected.user.cpfMasked ?? '—'}</dd></div>
                <div><dt>Celular</dt><dd>{formatCellphone(selected.user.cellphone)}</dd></div>
                <div><dt>Saldo</dt><dd>{selected.user.balance}</dd></div>
                <div><dt>Créditos usados</dt><dd>{selected.user.creditsUsed}</dd></div>
              </dl>

              <div className="admin-user-actions">
                <label className="field">
                  <span className="field__label">Status da conta</span>
                  <select className="field__input" value={selected.user.status}
                    disabled={busyAction || selected.user.id === currentUser.id}
                    onChange={(event) => void mutate(
                      () => api('/api/admin/users/' + selected.user.id + '/status', {
                        method:'PATCH',
                        body:JSON.stringify({status:event.target.value}),
                      }),
                      'Status atualizado.',
                    )}>
                    <option value="ACTIVE">Ativo</option>
                    <option value="BLOCKED">Bloqueado</option>
                    <option value="PENDING">Pendente</option>
                  </select>
                </label>
                <label className="field">
                  <span className="field__label">Perfil</span>
                  <select className="field__input" value={selected.user.role}
                    disabled={busyAction || selected.user.id === currentUser.id}
                    onChange={(event) => void mutate(
                      () => api('/api/admin/users/' + selected.user.id + '/role', {
                        method:'PATCH',
                        body:JSON.stringify({role:event.target.value}),
                      }),
                      'Perfil atualizado.',
                    )}>
                    <option value="USER">Usuário</option>
                    <option value="ADMIN">Administrador</option>
                  </select>
                </label>
                <label className="field">
                  <span className="field__label">Adicionar créditos</span>
                  <input className="field__input" type="number" min={1} max={1000}
                    value={creditAmount} onChange={(event) => setCreditAmount(event.target.value)} />
                </label>
                <Button type="button" disabled={busyAction} onClick={grantCredits}>
                  {busyAction ? 'Processando…' : 'Depositar créditos'}
                </Button>
              </div>

              <h3 className="admin-subtitle">Movimentações recentes</h3>
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead><tr><th>Data</th><th>Motivo</th><th>Valor</th></tr></thead>
                  <tbody>
                    {selected.movements.map((movement) => (
                      <tr key={movement.id}>
                        <td>{formatDate(movement.createdAt)}</td>
                        <td>{movement.reason}</td>
                        <td>{movement.amount > 0 ? '+' : ''}{movement.amount}</td>
                      </tr>
                    ))}
                    {selected.movements.length === 0
                      ? <tr><td colSpan={3}>Nenhuma movimentação.</td></tr>
                      : null}
                  </tbody>
                </table>
              </div>
            </section>
          ) : null}

          <section className="account-panel" aria-labelledby="audit-title">
            <h2 className="account-panel__title" id="audit-title">Auditoria administrativa</h2>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead><tr><th>Data</th><th>Administrador</th><th>Ação</th><th>Usuário</th></tr></thead>
                <tbody>
                  {audit.map((entry) => (
                    <tr key={entry.id}>
                      <td>{formatDate(entry.createdAt)}</td>
                      <td>{entry.admin.name ?? entry.admin.email}</td>
                      <td>{actionLabel(entry.action)}</td>
                      <td>{entry.target?.name ?? entry.target?.email ?? '—'}</td>
                    </tr>
                  ))}
                  {audit.length === 0 ? <tr><td colSpan={4}>Nenhuma ação administrativa registrada.</td></tr> : null}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </PageLayout>
  );
}
