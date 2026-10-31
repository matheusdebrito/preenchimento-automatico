import { useState } from 'react';
import { ArrowRight, Eye, EyeOff, FileCheck2, LockKeyhole, ShieldCheck, Waves } from 'lucide-react';
import type { FormEvent } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { PageLayout } from '../components/layout/PageLayout';
import { Notice } from '../components/ui/Notice';
import { api, ApiError } from '../lib/api';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useAuth } from '../features/auth/AuthProvider';
import type { SessionUser } from '../features/auth/AuthProvider';

export function AuthPage() {
  const [params] = useSearchParams();
  // Reset only the form when its URL-driven mode changes; session state stays intact.
  const mode = params.get('modo') === 'cadastro' ? 'cadastro' : 'entrar';
  return <AuthPageForm key={mode} />;
}

function AuthPageForm() {
  const [params, setParams] = useSearchParams();
  const register = params.get('modo') === 'cadastro';
  useDocumentTitle(register ? 'Criar conta' : 'Entrar');
  const [fullName, setFullName] = useState('');
  const [cellphone, setCellphone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
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
        ? { fullName, cellphone, email, password }
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
        setError('Revise seu nome, celular, e-mail e senha.');
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
      <div className="auth-page">
        <div className="auth-shell">
          <aside className="auth-story" aria-label="Conheça o preenchimento automático">
            <div className="auth-story__top">
              <span className="auth-story__symbol" aria-hidden="true"><Waves /></span>
              <span className="auth-story__eyebrow">Sua documentação, mais simples</span>
            </div>
            <div className="auth-story__content">
              <p className="auth-story__overline">PRATICIDADE PARA NAVEGAR</p>
              <h2>Menos tempo preenchendo. Mais tempo para você.</h2>
              <p>Organize seus dados uma vez, confira as informações e gere os formulários do serviço escolhido.</p>
              <div className="auth-story__steps">
                <div><FileCheck2 aria-hidden="true" /><span>Formulários organizados por serviço</span></div>
                <div><ShieldCheck aria-hidden="true" /><span>Você revisa cada informação antes de gerar</span></div>
                <div><LockKeyhole aria-hidden="true" /><span>Documentos de entrada tratados temporariamente</span></div>
              </div>
            </div>
            <div className="auth-story__bottom">Uma ferramenta independente, não vinculada à Marinha do Brasil.</div>
            <div className="auth-story__waves" aria-hidden="true"><Waves /></div>
          </aside>

          <section className="auth-panel" aria-labelledby="auth-title">
            <div className="auth-panel__top">
              <p className="auth-panel__eyebrow">{register ? 'PRIMEIRO ACESSO' : 'ÁREA DO USUÁRIO'}</p>
              <h1 id="auth-title">{register ? 'Criar conta' : 'Entrar na minha conta'}</h1>
              <p className="auth-panel__intro">{register
                ? 'Comece com seus dados de contato. É rápido e sem pedir CPF.'
                : 'Acesse sua conta e continue de onde parou.'}</p>
            </div>

            <nav className="auth-switch" aria-label="Escolher entre login e cadastro">
              <Link
                to={{ pathname: '/entrar', search: next ? '?' + new URLSearchParams({ next }) : '' }}
                aria-label="Alternar para login"
                className={!register ? 'auth-switch__item auth-switch__item--active' : 'auth-switch__item'}
                aria-current={!register ? 'page' : undefined}
              >Entrar</Link>
              <Link
                to={{ pathname: '/entrar', search: '?' + new URLSearchParams({
                  ...(next ? { next } : {}),
                  modo: 'cadastro',
                }) }}
                aria-label="Alternar para cadastro"
                className={register ? 'auth-switch__item auth-switch__item--active' : 'auth-switch__item'}
                aria-current={register ? 'page' : undefined}
              >Criar conta</Link>
            </nav>

            {session.status === 'unavailable' ? (
              <Notice tone="danger" role="alert">
                Não foi possível consultar sua sessão agora. Você ainda pode tentar entrar normalmente.
                {' '}
                <button type="button" className="live-text-button"
                  onClick={() => void refreshSession()}>Tentar novamente</button>
              </Notice>
            ) : null}
            {error ? <Notice tone="danger" role="alert">{error}</Notice> : null}

            <form className="auth-form" onSubmit={(event) => void submit(event)}>
              {register ? (
                <>
                  <label className="auth-field">
                    <span>Nome completo</span>
                    <input type="text" name="name" autoComplete="name" maxLength={120} required
                      placeholder="Como podemos chamar você?" value={fullName}
                      onChange={(event) => setFullName(event.target.value)} />
                  </label>
                  <label className="auth-field">
                    <span>Celular</span>
                    <input type="tel" name="tel" autoComplete="tel" inputMode="tel" maxLength={20}
                      placeholder="(21) 99999-9999" required value={cellphone}
                      onChange={(event) => setCellphone(event.target.value)} />
                  </label>
                </>
              ) : null}
              <label className="auth-field">
                <span>E-mail</span>
                <input type="email" name="email" autoComplete="email" inputMode="email" required
                  placeholder="voce@exemplo.com" value={email}
                  onChange={(event) => setEmail(event.target.value)} />
              </label>
              <div className="auth-field">
                <label htmlFor="auth-password">Senha (mínimo de 12 caracteres)</label>
                <div className="auth-password">
                  <input id="auth-password" type={showPassword ? 'text' : 'password'}
                    autoComplete={register ? 'new-password' : 'current-password'}
                    minLength={12} required value={password}
                    onChange={(event) => setPassword(event.target.value)} />
                  <button type="button" aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                    aria-pressed={showPassword} onClick={() => setShowPassword((value) => !value)}>
                    {showPassword ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
                  </button>
                </div>
              </div>
              {register ? (
                <div className="auth-field">
                  <label htmlFor="auth-confirmation">Confirmar senha</label>
                  <div className="auth-password">
                    <input id="auth-confirmation" type={showConfirmation ? 'text' : 'password'}
                      autoComplete="new-password" minLength={12} required
                      value={passwordConfirmation}
                      onChange={(event) => setPasswordConfirmation(event.target.value)} />
                    <button type="button" aria-label={showConfirmation
                      ? 'Ocultar confirmação de senha' : 'Mostrar confirmação de senha'}
                      aria-pressed={showConfirmation}
                      onClick={() => setShowConfirmation((value) => !value)}>
                      {showConfirmation
                        ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
                    </button>
                  </div>
                </div>
              ) : null}

              <button className="auth-submit" type="submit" disabled={busy}>
                <span>{busy ? 'Aguarde…' : register ? 'Criar conta' : 'Entrar'}</span>
                {!busy ? <ArrowRight aria-hidden="true" /> : null}
              </button>
              {register ? (
                <p className="auth-privacy"><ShieldCheck aria-hidden="true" />
                  Seu CPF não é solicitado nem armazenado no cadastro.</p>
              ) : null}
            </form>

            <div className="auth-panel__footer">
              <span>{register ? 'Já tem uma conta?' : 'Ainda não tem conta?'}</span>
              <button type="button" className="auth-panel__toggle" onClick={() => {
                setParams((current) => {
                  const updated = new URLSearchParams(current);
                  if (register) updated.delete('modo');
                  else updated.set('modo', 'cadastro');
                  return updated;
                });
              }}>{register ? 'Já tenho uma conta' : 'Ainda não tenho conta — cadastrar'}</button>
            </div>
            <Link className="auth-back" to="/">Voltar para o início</Link>
          </section>
        </div>
      </div>
    </PageLayout>
  );
}
