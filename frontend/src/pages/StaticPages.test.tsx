import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { App } from '../App';

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}

describe('páginas internas', () => {
  it(
    'apresenta a conta com saldo de teste e ações',
    async () => {
      renderAt('/minha-conta');

      expect(
        await screen.findByRole('heading', { level: 1, name: 'Bem-vindo!' }, { timeout: 5000 }),
      ).toBeTruthy();
      expect(screen.getByText('Seus créditos')).toBeTruthy();
      expect(screen.getByText('processos disponíveis')).toBeTruthy();
      expect(screen.getByText('Créditos fictícios')).toBeTruthy();

      const fillLink = screen.getByRole('link', { name: /Preencher documentos/ });
      expect(fillLink.getAttribute('href')).toBe('/preencher/servico');
      expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    },
    15000,
  );

  it(
    'explica os créditos sem simular compra ou preços',
    async () => {
      renderAt('/creditos');

      expect(
        await screen.findByRole(
          'heading',
          { level: 1, name: 'Pague por processo, sem mensalidade.' },
          { timeout: 5000 },
        ),
      ).toBeTruthy();
      expect(screen.getByText('1 crédito = preenchimento de um processo')).toBeTruthy();
      expect(screen.getByText('Compra indisponível no protótipo')).toBeTruthy();
      expect(screen.getAllByText('Em breve')).toHaveLength(2);
      expect(screen.queryByRole('button', { name: /comprar/i })).toBeNull();
      expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    },
    15000,
  );

  it(
    'lista movimentações de crédito fictícias e avisa sobre a demonstração',
    async () => {
      renderAt('/creditos/historico');

      expect(
        await screen.findByRole('heading', { level: 1, name: 'Histórico de créditos' }, { timeout: 5000 }),
      ).toBeTruthy();
      expect(screen.getByText('Demonstração de interface')).toBeTruthy();
      expect(screen.getByText('Concessão de teste')).toBeTruthy();
      expect(screen.getByText('Uso em um processo')).toBeTruthy();
      expect(screen.getByText('Estorno')).toBeTruthy();
      expect(screen.queryByText('Você ainda não tem movimentações.')).toBeNull();
      expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    },
    15000,
  );

  it(
    'exibe uma página 404 útil',
    async () => {
      renderAt('/rota-que-nao-existe');

      expect(
        await screen.findByRole('heading', { level: 1, name: 'Página não encontrada' }, { timeout: 5000 }),
      ).toBeTruthy();
      expect(screen.getByRole('link', { name: 'Ir para o início' }).getAttribute('href')).toBe('/');
      expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    },
    15000,
  );
});
