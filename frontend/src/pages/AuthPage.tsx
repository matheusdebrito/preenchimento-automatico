import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { PageLayout } from '../components/layout/PageLayout';
import { Button } from '../components/ui/Button';
import { Notice } from '../components/ui/Notice';
import { api, ApiError } from '../lib/api';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useAuth } from '../features/auth/AuthProvider';
import type { SessionUser } from '../features/auth/AuthProvider';

export function AuthPage() {
  useDocumentTitle('Entrar');
  const [params] = useSearchParams();
  const [register, setRegister] = useState(() => params.get('modo') === 'cadastro');
  const [fullName, setFullName] = useState('');
  const [cpf, setCpf] = useState('');
  const [cellphone, setCellphone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const { session, acceptLogin, refreshSession } = useAuth();
  const next = params.get('next');
  const safeNext = next?.startsWith('/preencher-real/') && !next.startsWith('//')
    ? next : '/minha-conta';

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    if (register && password !== passwordConfirmation) {
      setError('As senhas não coincidem.');
      return;
    }
    setBusy(true);
    try {
      const payload = register
        ? { fullName, cpf, cellphone, email, password }
        : { email, password };
      const result = await api<{user:SessionUser}>(
        register ? '/api/auth/register' : '/api/auth/login',
        { method: 'POST', body: JSON.stringify(payload) },
      );
      acceptLogin(result.user);
      navigate(safeNext, { replace: true });
    } catch (cause) {
      if (cause instanceof ApiError &&
        cause.status === 409 && cause.errorCode === 'already_authenticated') {
        await refreshSession();
        return;
      }
      if (cause instanceof ApiError && cause.status === 401 && !register) {
        setError('E-mail ou senha inválidos.');
      } else if (cause instanceof ApiError && cause.status === 409 && register) {
        setError('Não foi possível criar a conta com os dados informados.');
      } else if (cause instanceof ApiError && cause.status === 400 && register) {
        setError('Revise nome, CPF, celular, e-mail e senha.');
      } else if (!(cause instanceof ApiError) || cause.status >= 500) {
        setError('Não foi possível conectar ao servidor. Tente novamente.');
      } else {
        setError('Não foi possível acessar a conta. Verifique os dados e tente novamente.');
      }
    } finally {
      setBusy(false);
    }
  };

  if (session.status === 'authenticated') {
    return <Navigate to={safeNext} replace />;
  }
  if (session.status === 'loading') {
    return (
      <PageLayout>
        <div className="page"><div className="container page-stack">
          <Notice tone="info" role="status">Verificando sua sessão…</Notice>
        </div></div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="page">
        <div className="container page-stack">
          {session.status === 'unavailable' ? (
            <Notice tone="danger" role="alert">
              Não foi possível consultar sua sessão agora. Você ainda pode tentar entrar normalmente.
              {' '}
              <button
                type="button"
                className="live-text-button"
                onClick={() => void refreshSession()}
              >
                Tentar novamente
              </button>
            </Notice>
          ) : null}
          <div className="card card--padded live-auth">
            <h1>{register ? 'Criar conta' : 'Entrar na minha conta'}</h1>
            <p>
              {register
                ? 'Crie sua conta com seus dados de identificação e contato.'
                : 'Entre para acessar seus créditos e processos.'}
            </p>
            {error ? <Notice tone="danger" role="alert">{error}</Notice> : null}
            <form className="live-form" onSubmit={(event) => void submit(event)}>
              {register ? (
                <>
                  <label className="field">
                    <span className="field__label">Nome completo</span>
                    <input
                      className="field__input"
                      type="text"
                      autoComplete="name"
                      maxLength={120}
                      required
                      value={fullName}
                      onChange={(event) => setFullName(event.target.value)}
                    />
                  </label>
                  <label className="field">
                    <span className="field__label">CPF</span>
                    <input
                      className="field__input"
                      type="text"
                      inputMode="numeric"
                      autoComplete="off"
                      maxLength={14}
                      placeholder="000.000.000-00"
                      required
                      value={cpf}
                      onChange={(event) => setCpf(event.target.value)}
                    />
                  </label>
                  <label className="field">
                    <span className="field__label">Celular</span>
                    <input
                      className="field__input"
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      maxLength={20}
                      placeholder="(21) 99999-9999"
                      required
                      value={cellphone}
                      onChange={(event) => setCellphone(event.target.value)}
                    />
                  </label>
                </>
              ) : null}
              <label className="field">
                <span className="field__label">E-mail</span>
                <input className="field__input" type="email" autoComplete="email" required
                  value={email} onChange={(event) => setEmail(event.target.value)} />
              </label>
              <label className="field">
                <span className="field__label">Senha (mínimo de 12 caracteres)</span>
                <input className="field__input" type="password" minLength={12} required
                  autoComplete={register ? 'new-password' : 'current-password'}
                  value={password} onChange={(event) => setPassword(event.target.value)} />
              </label>
              {register ? (
                <label className="field">
                  <span className="field__label">Confirmar senha</span>
                  <input
                    className="field__input"
                    type="password"
                    minLength={12}
                    required
                    autoComplete="new-password"
                    value={passwordConfirmation}
                    onChange={(event) => setPasswordConfirmation(event.target.value)}
                  />
                </label>
              ) : null}
              <Button type="submit" disabled={busy}>
                {busy ? 'Aguarde…' : register ? 'Criar conta' : 'Entrar'}
              </Button>
            </form>
            <button
              type="button"
              className="live-text-button"
              onClick={() => {
                setRegister(!register);
                setError('');
                setPasswordConfirmation('');
              }}
            >
              {register ? 'Já tenho uma conta' : 'Ainda não tenho conta — cadastrar'}
            </button>
            <p><Link to="/">Voltar para o início</Link></p>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
