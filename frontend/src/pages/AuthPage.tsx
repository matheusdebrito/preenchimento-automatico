import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { PageLayout } from '../components/layout/PageLayout';
import { Button } from '../components/ui/Button';
import { Notice } from '../components/ui/Notice';
import { api } from '../lib/api';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export function AuthPage() {
  useDocumentTitle('Entrar');
  const [register, setRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      await api<{user:{id:string;email:string}}>(
        register ? '/api/auth/register' : '/api/auth/login',
        { method: 'POST', body: JSON.stringify({ email, password }) },
      );
      const next = params.get('next');
      const safeNext = next?.startsWith('/preencher-real/') && !next.startsWith('//') ? next : '/minha-conta';
      navigate(safeNext, { replace: true });
    } catch {
      setError('Não foi possível acessar a conta. Verifique os dados e tente novamente.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <PageLayout>
      <div className="page">
        <div className="container page-stack">
          <div className="card card--padded live-auth">
            <h1>{register ? 'Criar conta' : 'Entrar na minha conta'}</h1>
            <p>Seus documentos são processados temporariamente. A conta guarda apenas dados operacionais e créditos.</p>
            {error ? <Notice tone="danger" role="alert">{error}</Notice> : null}
            <form className="live-form" onSubmit={(event) => void submit(event)}>
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
              <Button type="submit" disabled={busy}>{busy ? 'Aguarde…' : register ? 'Criar conta' : 'Entrar'}</Button>
            </form>
            <button type="button" className="live-text-button" onClick={() => { setRegister(!register); setError(''); }}>
              {register ? 'Já tenho uma conta' : 'Ainda não tenho conta — cadastrar'}
            </button>
            <p><Link to="/">Voltar para o início</Link></p>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
