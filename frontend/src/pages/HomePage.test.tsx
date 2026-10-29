import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HomePage } from './HomePage';
import { AuthProvider } from '../features/auth/AuthProvider';

function renderHome(services: readonly object[] = []) {
  vi.stubGlobal('fetch', vi.fn(async (url: RequestInfo | URL) => new Response(
    JSON.stringify(String(url) === '/api/auth/me'
      ? { error: 'unauthorized' } : { services }),
    { status: String(url) === '/api/auth/me' ? 401 : 200,
      headers: { 'Content-Type': 'application/json' } },
  )));
  return render(
    <MemoryRouter>
      <AuthProvider><HomePage /></AuthProvider>
    </MemoryRouter>,
  );
}

afterEach(() => vi.unstubAllGlobals());

describe('HomePage', () => {
  it('apresenta a proposta e o caminho para começar', () => {
    renderHome();

    expect(
      screen.getByRole('heading', { level: 1, name: 'Documentos da Marinha sem complicação.' }),
    ).toBeTruthy();
    expect(
      screen.getByText(
        /Escolha o serviço, anexe os documentos que quiser ou digite os dados/ ,
      ),
    ).toBeTruthy();

    const startLink = screen.getByRole('link', { name: /Começar agora/ });
    expect(startLink.getAttribute('href')).toBe('/#categories-title');
  });

  it('mostra as três categorias e sinaliza as que ainda não estão disponíveis', () => {
    renderHome();

    expect(screen.getByRole('heading', { level: 2, name: 'O que você deseja fazer?' })).toBeTruthy();
    expect(screen.getByText('Embarcações e jet skis')).toBeTruthy();
    expect(screen.getByText('Arrais, Mestre e Capitão')).toBeTruthy();
    expect(screen.getByText('Aquaviários')).toBeTruthy();

    expect(screen.queryByRole('link', { name: /Embarcações e jet skis/ })).toBeNull();
    expect(screen.getAllByText('Em breve')).toHaveLength(3);
  });

  it('exibe um único serviço real em QA, sem abrir a demonstração paralela', async () => {
    renderHome([{
      id: 'transferencia-moto-aquatica', title: 'Transferência de moto aquática',
      description: 'Amostra local', creditCost: 0, questions: [],
      reviewFields: [], documentRequirements: [], formVersionIds: ['bdmoto-v1'],
    }]);
    const pilot = await screen.findByRole('link', { name: /Transferência de moto aquática/ });
    expect(pilot.getAttribute('href')).toBe('/preencher-real/transferencia-moto-aquatica');
    expect(screen.getByRole('link', { name: /Começar agora/ }).getAttribute('href'))
      .toBe('/preencher-real/transferencia-moto-aquatica');
    expect(screen.getAllByText(/Prévia local para revisão — sem créditos/)).toHaveLength(1);
    expect(document.querySelectorAll('a[href="/preencher/servico"]')).toHaveLength(0);
    expect(screen.queryByRole('heading', { name: 'Teste técnico com dados fictícios' })).toBeNull();
  });

  it('libera o card de embarcação somente quando o backend publica o serviço', async () => {
    renderHome([{
      id: 'inscricao-embarcacao', title: 'Inscrição inicial de embarcação',
      description: 'Fluxo homologado', creditCost: 1, questions: [],
      reviewFields: [], documentRequirements: [], formVersionIds: ['requerimento-embarcacao-er-2026-v1'],
    }]);

    const service = await screen.findByRole('link', { name: /Inscrição inicial de embarcação/ });
    expect(service.getAttribute('href')).toBe('/preencher-real/inscricao-embarcacao');
    expect(screen.getByText('Preencher — 1 crédito')).toBeTruthy();
  });

  it('distingue demonstração visual e processamento temporário no servidor', () => {
    renderHome();

    expect(
      screen.getByRole('heading', { level: 2, name: 'Seus documentos ficam sob seu controle' }),
    ).toBeTruthy();
    expect(
      screen.getByText(/arquivos enviados são processados temporariamente no servidor/),
    ).toBeTruthy();
    expect(screen.getByText(/expiram após.*20 minutos/)).toBeTruthy();
  });

  it('oferece atalho de acessibilidade para o conteúdo principal', () => {
    renderHome();

    const skipLink = screen.getByRole('link', { name: 'Pular para o conteúdo' });
    expect(skipLink.getAttribute('href')).toBe('#conteudo');
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  });
});
