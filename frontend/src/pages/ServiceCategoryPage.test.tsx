import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ServiceCategoryPage } from './ServiceCategoryPage';

function renderCategory(path: string, services: readonly object[] = []) {
  vi.stubGlobal('fetch', vi.fn(async () => new Response(
    JSON.stringify({ services }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  )));
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/servicos/:categoryId" element={<ServiceCategoryPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

afterEach(() => vi.unstubAllGlobals());

describe('ServiceCategoryPage', () => {
  it('lista somente os serviços de embarcações na categoria correspondente', async () => {
    renderCategory('/servicos/embarcacoes', [{
      id: 'inscricao-embarcacao',
      title: 'Inscrição inicial de embarcação',
      description: 'Fluxo homologado',
      creditCost: 1,
      questions: [],
      reviewFields: [],
      documentRequirements: [],
      formVersionIds: ['requerimento-embarcacao-er-2026-v1'],
    }]);

    expect(screen.getByRole('heading', { level: 1, name: 'Embarcações e jet skis' })).toBeTruthy();
    const available = await screen.findByRole('link', { name: /Inscrição inicial de embarcação/ });
    expect(available.getAttribute('href')).toBe('/preencher-real/inscricao-embarcacao');
    expect(screen.getByText('Transferência de propriedade')).toBeTruthy();
    expect(screen.getAllByText('Formulário em validação').length).toBeGreaterThan(0);
  });

  it('libera renovação da CHA e mantém inscrição para exame em validação', async () => {
    const { unmount } = renderCategory('/servicos/amadores', [{
      id: 'renovacao-cha-amador',
      title: 'Renovação da CHA',
      description: 'Fluxo homologado',
      creditCost: 1,
      questions: [],
      reviewFields: [],
      documentRequirements: [],
      formVersionIds: ['requerimento-cha-amador-2026-v1'],
    }]);
    expect(screen.getByRole('heading', { level: 1, name: 'Arrais, Mestre e Capitão' })).toBeTruthy();
    expect(screen.getByText('Inscrição para exame')).toBeTruthy();
    const renewal = await screen.findByRole('link', { name: /Renovação da CHA/ });
    expect(renewal.getAttribute('href')).toBe('/preencher-real/renovacao-cha-amador');
    expect(screen.getAllByText('Formulário em validação')).toHaveLength(1);
    unmount();

    renderCategory('/servicos/aquaviarios');
    expect(screen.getByRole('heading', { level: 1, name: 'Aquaviários' })).toBeTruthy();
    expect(screen.getByRole('heading', { level: 2, name: 'Serviços em preparação' })).toBeTruthy();
  });

  it('permite voltar para as categorias', () => {
    renderCategory('/servicos/embarcacoes');
    expect(screen.getByRole('link', { name: /Voltar às categorias/ }).getAttribute('href')).toBe('/');
  });
});
