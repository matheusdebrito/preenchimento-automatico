import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AppHeader } from './AppHeader';

function renderHeader() {
  return render(
    <MemoryRouter>
      <AppHeader />
    </MemoryRouter>,
  );
}

describe('AppHeader', () => {
  it('mantém a navegação principal rotulada e com rotas implementadas', () => {
    renderHeader();

    const navigation = screen.getByRole('navigation', { name: 'Navegação principal' });
    expect(navigation).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Início' }).getAttribute('href')).toBe('/');
    expect(screen.getByRole('link', { name: 'Minha conta' }).getAttribute('href')).toBe(
      '/minha-conta',
    );
    expect(screen.getByRole('link', { name: 'Créditos' }).getAttribute('href')).toBe('/creditos');
  });

  it('abre o menu pelo teclado e fecha com Escape', async () => {
    const user = userEvent.setup();
    renderHeader();

    const openButton = screen.getByRole('button', { name: 'Menu' });
    expect(openButton.getAttribute('aria-expanded')).toBe('false');

    await user.click(openButton);

    const closeButton = screen.getByRole('button', { name: 'Fechar menu' });
    expect(closeButton.getAttribute('aria-expanded')).toBe('true');

    await user.keyboard('{Escape}');

    expect(screen.getByRole('button', { name: 'Menu' }).getAttribute('aria-expanded')).toBe(
      'false',
    );
  });
});
