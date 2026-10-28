import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../../features/auth/AuthProvider';
import { AppHeader } from './AppHeader';

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status, headers: { 'Content-Type': 'application/json' },
  });
}

function renderHeader(authenticated = false) {
  const fetcher = vi.fn(async (input: RequestInfo | URL): Promise<Response> => {
    if (String(input) === '/api/auth/me') {
      return authenticated
        ? json({ user: { id: 'user-test', email: 'fixture@example.invalid' } })
        : json({ error: 'unauthorized' }, 401);
    }
    if (String(input) === '/api/auth/logout') return json({ ok: true });
    return json({ error: 'not_found' }, 404);
  });
  vi.stubGlobal('fetch', fetcher);
  const rendered = render(
    <MemoryRouter>
      <AuthProvider><AppHeader /></AuthProvider>
    </MemoryRouter>,
  );
  return { ...rendered, fetcher };
}

afterEach(() => vi.unstubAllGlobals());

describe('AppHeader', () => {
  it('mostra Entrar apenas para visitante e mantém navegação acessível', async () => {
    renderHeader();
    const navigation = screen.getByRole('navigation', { name: 'Navegação principal' });
    expect(navigation).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Início' }).getAttribute('href')).toBe('/');
    expect(screen.getByRole('link', { name: 'OCR' }).getAttribute('href')).toBe('/ocr');
    expect(await screen.findByRole('link', { name: 'Entrar' })).toBeTruthy();
    expect(screen.queryByRole('link', { name: 'Minha conta' })).toBeNull();
    expect(screen.getByRole('link', { name: 'Créditos' }).getAttribute('href')).toBe('/creditos');
  });

  it('substitui Entrar por Minha conta e Sair quando autenticado', async () => {
    const { fetcher } = renderHeader(true);
    expect(await screen.findByRole('link', { name: 'Minha conta' })).toBeTruthy();
    expect(screen.queryByRole('link', { name: 'Entrar' })).toBeNull();
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Sair' }));
    expect(await screen.findByRole('link', { name: 'Entrar' })).toBeTruthy();
    expect(screen.queryByRole('link', { name: 'Minha conta' })).toBeNull();
    expect(fetcher.mock.calls.some(([url]) => String(url) === '/api/auth/logout')).toBe(true);
  });

  it('fecha o menu após selecionar uma rota, sem recriar o botão', async () => {
    const user = userEvent.setup();
    renderHeader();
    const toggle = screen.getByRole('button', { name: 'Menu' });
    await user.click(toggle);
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    await user.click(screen.getByRole('link', { name: 'Início' }));
    expect(screen.getByRole('button', { name: 'Menu' })).toBe(toggle);
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
  });

  it('abre o menu pelo teclado e fecha com Escape', async () => {
    const user = userEvent.setup();
    renderHeader();
    const openButton = screen.getByRole('button', { name: 'Menu' });
    const visibleLabel = screen.getByText('Menu', { selector: '.menu-toggle__label' });
    expect(visibleLabel.closest('button')).toBe(openButton);
    expect(visibleLabel.getAttribute('aria-hidden')).toBe('true');
    expect(openButton.getAttribute('aria-expanded')).toBe('false');
    await user.click(openButton);
    const closeButton = screen.getByRole('button', { name: 'Fechar menu' });
    // The text stays "Menu", but assistive tech is informed that the action closes it.
    expect(screen.getByText('Menu', { selector: '.menu-toggle__label' })).toBe(visibleLabel);
    expect(closeButton).toBe(openButton);
    expect(closeButton.getAttribute('aria-expanded')).toBe('true');
    expect(closeButton.classList.contains('menu-toggle--open')).toBe(true);
    expect(closeButton.querySelectorAll('svg')).toHaveLength(2);
    expect(screen.queryByText('Fechar menu')).toBeNull();
    const navigation = screen.getByRole('navigation', { name: 'Navegação principal' });
    expect(navigation.classList.contains('site-nav--open')).toBe(true);
    await user.keyboard('{Escape}');
    expect(screen.getByRole('button', { name: 'Menu' })).toBe(openButton);
    expect(screen.getByText('Menu', { selector: '.menu-toggle__label' })).toBe(visibleLabel);
    expect(openButton.getAttribute('aria-expanded')).toBe('false');
    expect(navigation.classList.contains('site-nav--open')).toBe(false);
  });
});
