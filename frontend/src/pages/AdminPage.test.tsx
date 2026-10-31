import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { App } from '../App';

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

const adminUser = {
  id: '00000000-0000-4000-8000-000000000001',
  email: 'admin@example.invalid',
  fullName: 'Administrador',
  cellphone: '5521999991111',
  status: 'ACTIVE',
  role: 'ADMIN',
};

const regularUser = {
  ...adminUser,
  id: '00000000-0000-4000-8000-000000000002',
  email: 'user@example.invalid',
  fullName: 'Usuário',
  role: 'USER',
};

afterEach(() => vi.unstubAllGlobals());

describe('painel administrativo', () => {
  it('mostra administração somente ao admin e carrega métricas e usuário', async () => {
    const targetId = '00000000-0000-4000-8000-000000000003';
    vi.stubGlobal('fetch', vi.fn(async (url: RequestInfo | URL): Promise<Response> => {
      const path = String(url);
      if (path === '/api/auth/me') return json({ user: adminUser });
      if (path === '/api/admin/dashboard') return json({
        users: { total: 2, active: 2, blocked: 0, pending: 0 },
        credits: { usedToday: 3, usedWeek: 8, usedMonth: 20, grantedMonth: 30, totalBalance: 10 },
      });
      if (path.startsWith('/api/admin/usage?period=')) {
        const period = new URL(path, 'http://localhost').searchParams.get('period') ?? '7d';
        const count = period === 'today' ? 24 : period === 'year' ? 12 : period === 'month' ? 30 : 7;
        return json({
          period,
          creditsUsed: 8,
          inputTokens: 1200,
          outputTokens: 300,
          points: Array.from({ length: count }, (_, index) => ({
            bucket: String(index),
            label: String(index + 1),
            creditsUsed: index === count - 1 ? 8 : 0,
            inputTokens: index === count - 1 ? 1200 : 0,
            outputTokens: index === count - 1 ? 300 : 0,
          })),
        });
      }
      if (path === '/api/admin/audit?limit=50') return json({ entries: [] });
      if (path.startsWith('/api/admin/users?')) return json({
        total: 1,
        page: 1,
        pageSize: 50,
        users: [{
          id: targetId,
          email: 'cliente@example.invalid',
          fullName: 'Cliente Teste',
          cellphone: '5521988887777',
          status: 'ACTIVE',
          role: 'USER',
          createdAt: '2026-10-30T12:00:00.000Z',
          balance: 5,
          creditsUsed: 4,
          lastCreditAt: null,
        }],
      });
      if (path === '/api/admin/users/' + targetId) return json({
        user: {
          id: targetId,
          email: 'cliente@example.invalid',
          fullName: 'Cliente Teste',
          cellphone: '5521988887777',
          status: 'ACTIVE',
          role: 'USER',
          createdAt: '2026-10-30T12:00:00.000Z',
          balance: 5,
          creditsUsed: 4,
        },
        movements: [],
      });
      return json({ error: 'not_found' }, 404);
    }));

    const user = userEvent.setup();
    render(<MemoryRouter initialEntries={['/admin']}><App /></MemoryRouter>);

    expect(await screen.findByRole('heading', { name: 'Painel administrativo' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Administração' })).toBeTruthy();
    expect(await screen.findByText('Créditos usados hoje')).toBeTruthy();
    expect(await screen.findByText('Tokens de entrada · Últimos 7 dias')).toBeTruthy();
    expect(screen.getByText('1.200')).toBeTruthy();
    expect(screen.getByText('Tokens de saída · Últimos 7 dias')).toBeTruthy();
    expect(screen.getByText('300')).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Créditos utilizados' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Tokens OpenAI' })).toBeTruthy();
    expect(await screen.findByText('Cliente Teste')).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'Ano' }));
    expect(await screen.findByText('Tokens de entrada · Ano')).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'Ver' }));
    expect(await screen.findByRole('heading', { name: 'Cliente Teste' })).toBeTruthy();
    expect(screen.queryByText('CPF')).toBeNull();
    expect(screen.getByRole('button', { name: 'Depositar créditos' })).toBeTruthy();
  });

  it('redireciona usuário comum para a própria conta e não mostra link administrativo', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url: RequestInfo | URL): Promise<Response> => {
      const path = String(url);
      if (path === '/api/auth/me') return json({ user: regularUser });
      if (path === '/api/credits/balance') return json({ balance: 0 });
      return json({ error: 'not_found' }, 404);
    }));

    render(<MemoryRouter initialEntries={['/admin']}><App /></MemoryRouter>);

    expect(await screen.findByRole('heading', { name: 'Usuário' })).toBeTruthy();
    expect(screen.queryByRole('link', { name: 'Administração' })).toBeNull();
    expect(screen.queryByRole('heading', { name: 'Painel administrativo' })).toBeNull();
  });
});
