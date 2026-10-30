import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { App } from '../App';

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status, headers: { 'Content-Type': 'application/json' },
  });
}

afterEach(() => vi.unstubAllGlobals());

describe('sessão compartilhada de navegação e autenticação', () => {
  it('impede mostrar o formulário de login quando já há sessão ativa', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url: RequestInfo | URL): Promise<Response> => {
      const path = String(url);
      if (path === '/api/auth/me') return json({
        user: { id: 'owner-fixture', email: 'owner@example.invalid' },
      });
      if (path === '/api/credits/balance') return json({ balance: 0 });
      return json({ error: 'not_found' }, 404);
    }));
    render(<MemoryRouter initialEntries={['/entrar']}><App /></MemoryRouter>);
    expect(await screen.findByRole('heading', { name: 'Sua conta' })).toBeTruthy();
    expect(screen.queryByRole('heading', { name: 'Entrar na minha conta' })).toBeNull();
    expect(screen.queryByRole('link', { name: 'Entrar' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Sair' })).toBeTruthy();
  });

  it('não bloqueia o login e mostra progresso ao repetir a consulta de sessão', async () => {
    let meCalls = 0;
    let resolveRetry!: (response: Response) => void;
    const retryResponse = new Promise<Response>((resolve) => {
      resolveRetry = resolve;
    });
    const fetcher = vi.fn(async (url: RequestInfo | URL): Promise<Response> => {
      const path = String(url);
      if (path === '/api/auth/me') {
        meCalls++;
        if (meCalls === 1) return json({ error: 'unavailable' }, 503);
        return retryResponse;
      }
      return json({ error: 'not_found' }, 404);
    });
    vi.stubGlobal('fetch', fetcher);
    const user = userEvent.setup();
    render(<MemoryRouter initialEntries={['/entrar']}><App /></MemoryRouter>);

    expect(await screen.findByText(/Não foi possível consultar sua sessão agora/)).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Entrar na minha conta' })).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(await screen.findByText('Verificando sua sessão…')).toBeTruthy();

    resolveRetry(json({ error: 'unauthorized' }, 401));
    await waitFor(() => {
      expect(screen.queryByText('Verificando sua sessão…')).toBeNull();
    });
    expect(screen.getByRole('heading', { name: 'Entrar na minha conta' })).toBeTruthy();
    expect(meCalls).toBe(2);
  });

  it('atualiza menu e rota após login sem precisar recarregar', async () => {
    let signedIn = false;
    const fetcher = vi.fn(async (url: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const path = String(url);
      if (path === '/api/auth/me') return signedIn
        ? json({ user: { id: 'owner-fixture', email: 'owner@example.invalid' } })
        : json({ error: 'unauthorized' }, 401);
      if (path === '/api/auth/login' && init?.method === 'POST') {
        signedIn = true;
        return json({ user: { id: 'owner-fixture', email: 'owner@example.invalid' } });
      }
      if (path === '/api/credits/balance') return json({ balance: 0 });
      if (path === '/api/auth/logout') {
        signedIn = false;
        return json({ ok: true });
      }
      return json({ error: 'not_found' }, 404);
    });
    vi.stubGlobal('fetch', fetcher);
    const user = userEvent.setup();
    render(<MemoryRouter initialEntries={['/entrar']}><App /></MemoryRouter>);

    expect(await screen.findByRole('heading', { name: 'Entrar na minha conta' })).toBeTruthy();
    await user.type(screen.getByLabelText('E-mail'), 'owner@example.invalid');
    await user.type(screen.getByLabelText(/Senha/), 'senha-de-teste-12345');
    await user.click(screen.getByRole('button', { name: 'Entrar' }));
    expect(await screen.findByRole('heading', { name: 'Sua conta' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Minha conta' })).toBeTruthy();
    expect(screen.queryByRole('link', { name: 'Entrar' })).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Sair' }));
    expect(await screen.findByRole('link', { name: 'Entrar' })).toBeTruthy();
  }, 25000);


  it('abre diretamente no modo cadastro pelo link do cabeçalho', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url: RequestInfo | URL): Promise<Response> => {
      if (String(url) === '/api/auth/me') return json({ error: 'unauthorized' }, 401);
      return json({ error: 'not_found' }, 404);
    }));

    render(<MemoryRouter initialEntries={['/entrar?modo=cadastro']}><App /></MemoryRouter>);

    expect(await screen.findByRole('heading', { name: 'Criar conta' })).toBeTruthy();
    expect(screen.getByLabelText('Nome completo')).toBeTruthy();
    expect(screen.getByLabelText('CPF')).toBeTruthy();
    expect(screen.getByLabelText('Celular')).toBeTruthy();
  });

  it('cadastra perfil completo e impede envio com confirmação de senha divergente', async () => {
    let registerBody: Record<string, unknown> | null = null;
    const fetcher = vi.fn(async (url: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const path = String(url);
      if (path === '/api/auth/me') return json({ error: 'unauthorized' }, 401);
      if (path === '/api/auth/register' && init?.method === 'POST') {
        registerBody = JSON.parse(String(init.body)) as Record<string, unknown>;
        return json({
          user: {
            id: 'new-user',
            email: 'maria@example.invalid',
            fullName: 'Maria da Silva',
            cellphone: '5521999998888',
            cpfMasked: '***.***.***-25',
            status: 'ACTIVE',
            role: 'USER',
          },
        }, 201);
      }
      if (path === '/api/credits/balance') return json({ balance: 0 });
      return json({ error: 'not_found' }, 404);
    });
    vi.stubGlobal('fetch', fetcher);
    const user = userEvent.setup();
    render(<MemoryRouter initialEntries={['/entrar']}><App /></MemoryRouter>);

    await screen.findByRole('heading', { name: 'Entrar na minha conta' });
    await user.click(screen.getByRole('button', { name: /cadastrar/i }));
    await user.type(screen.getByLabelText('Nome completo'), 'Maria da Silva');
    await user.type(screen.getByLabelText('CPF'), '529.982.247-25');
    await user.type(screen.getByLabelText('Celular'), '(21) 99999-8888');
    await user.type(screen.getByLabelText('E-mail'), 'maria@example.invalid');
    await user.type(screen.getByLabelText('Senha (mínimo de 12 caracteres)'), 'fixture-password-12345');
    await user.type(screen.getByLabelText('Confirmar senha'), 'fixture-password-54321');
    await user.click(screen.getByRole('button', { name: 'Criar conta' }));

    expect(await screen.findByText('As senhas não coincidem.')).toBeTruthy();
    expect(registerBody).toBeNull();

    await user.clear(screen.getByLabelText('Confirmar senha'));
    await user.type(screen.getByLabelText('Confirmar senha'), 'fixture-password-12345');
    await user.click(screen.getByRole('button', { name: 'Criar conta' }));

    expect(await screen.findByRole('heading', { name: 'Maria da Silva' })).toBeTruthy();
    expect(registerBody).toMatchObject({
      fullName: 'Maria da Silva',
      cpf: '529.982.247-25',
      cellphone: '(21) 99999-8888',
      email: 'maria@example.invalid',
    });
    expect(registerBody).not.toHaveProperty('role');
    expect(registerBody).not.toHaveProperty('status');
    expect(screen.getByText('***.***.***-25')).toBeTruthy();
    expect(screen.getByText('(21) 99999-8888')).toBeTruthy();
  }, 25000);

});
