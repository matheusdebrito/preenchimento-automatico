import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ServiceCategoryPage } from './ServiceCategoryPage';
import { AuthProvider } from '../features/auth/AuthProvider';

function renderCategory(path: string, services: readonly object[] = []) {
  vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
    if (String(input) === '/api/auth/me') {
      return new Response(JSON.stringify({ error: 'unauthorized' }), {
        status: 401, headers: { 'Content-Type': 'application/json' },
      });
    }
    return new Response(JSON.stringify({ services }), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    });
  }));
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/servicos/:categoryId" element={<ServiceCategoryPage />} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
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
    expect(screen.getByText('Transferência de propriedade e/ou jurisdição')).toBeTruthy();
    expect(screen.getAllByText('Formulário em validação').length).toBeGreaterThan(0);
  });

  it('libera todos os serviços homologados de amadores', async () => {
    const { unmount } = renderCategory('/servicos/amadores', [{
      id: 'inscricao-exame-amador',
      title: 'Inscrição para exame de amador',
      description: 'Fluxo homologado',
      creditCost: 1, questions: [], reviewFields: [], documentRequirements: [],
      formVersionIds: ['requerimento-cha-amador-2026-v1'],
    }, {
      id: 'renovacao-cha-amador',
      title: 'Renovação da CHA',
      description: 'Fluxo homologado',
      creditCost: 1, questions: [], reviewFields: [], documentRequirements: [],
      formVersionIds: ['requerimento-cha-amador-2026-v1'],
    }, {
      id: 'emissao-cha-veleiro',
      title: 'Emissão de CHA de Veleiro',
      description: 'Fluxo homologado',
      creditCost: 1, questions: [], reviewFields: [], documentRequirements: [],
      formVersionIds: ['requerimento-cha-amador-2026-v1'],
    }, {
      id: 'concessao-cha-equivalencia',
      title: 'Concessão de CHA por equivalência profissional',
      description: 'Fluxo homologado',
      creditCost: 1, questions: [], reviewFields: [], documentRequirements: [],
      formVersionIds: ['requerimento-cha-amador-2026-v1'],
    }, {
      id: 'renovacao-cha-agregacao-mta',
      title: 'Renovação da CHA com agregação de Motonauta',
      description: 'Fluxo homologado',
      creditCost: 1, questions: [], reviewFields: [], documentRequirements: [],
      formVersionIds: ['requerimento-cha-amador-2026-v1', 'requerimento-motonauta-2026-v1'],
    }]);
    expect(screen.getByRole('heading', { level: 1, name: 'Arrais, Mestre e Capitão' })).toBeTruthy();
    expect((await screen.findByRole('link', { name: /Inscrição para exame de amador/ })).getAttribute('href'))
      .toBe('/preencher-real/inscricao-exame-amador');
    const renewalHeading = await screen.findByRole('heading', { level: 2, name: 'Renovação da CHA' });
    expect(renewalHeading.closest('a')?.getAttribute('href'))
      .toBe('/preencher-real/renovacao-cha-amador');
    expect((await screen.findByRole('link', { name: /Emissão de CHA de Veleiro/ })).getAttribute('href'))
      .toBe('/preencher-real/emissao-cha-veleiro');
    expect((await screen.findByRole('link', { name: /Concessão de CHA por equivalência profissional/ })).getAttribute('href'))
      .toBe('/preencher-real/concessao-cha-equivalencia');
    expect((await screen.findByRole('link', { name: /Renovação da CHA com agregação de Motonauta/ })).getAttribute('href'))
      .toBe('/preencher-real/renovacao-cha-agregacao-mta');
    expect(screen.queryByText('Formulário em validação')).toBeNull();
    unmount();

    renderCategory('/servicos/aquaviarios', [
      {
        id: 'inscricao-inicial-cir-aquaviario',
        title: 'Inscrição inicial / emissão da CIR',
        description: 'Fluxo homologado',
        creditCost: 1, questions: [], reviewFields: [], documentRequirements: [],
        formVersionIds: ['declaracao-residencia-aquaviario-2026-v1'],
      },
      {
        id: 'segunda-via-cir-aquaviario',
        title: '2ª via da CIR',
        description: 'Fluxo homologado',
        creditCost: 1, questions: [], reviewFields: [], documentRequirements: [],
        formVersionIds: ['declaracao-residencia-aquaviario-2026-v1'],
      },
      {
        id: 'revalidacao-cir-aquaviario',
        title: 'Revalidação da CIR',
        description: 'Fluxo homologado',
        creditCost: 1, questions: [], reviewFields: [], documentRequirements: [],
        formVersionIds: ['declaracao-residencia-aquaviario-2026-v1'],
      },
      {
        id: 'ascensao-categoria-aquaviario',
        title: 'Ascensão de categoria',
        description: 'Fluxo homologado',
        creditCost: 1, questions: [], reviewFields: [], documentRequirements: [],
        formVersionIds: ['declaracao-residencia-aquaviario-2026-v1'],
      },
      {
        id: 'emissao-certificado-aquaviario',
        title: 'Emissão de certificado',
        description: 'Fluxo homologado',
        creditCost: 1, questions: [], reviewFields: [], documentRequirements: [],
        formVersionIds: [
          'requerimento-certificacao-aquaviario-2026-v1',
          'declaracao-residencia-aquaviario-2026-v1',
        ],
      },
      {
        id: 'segunda-via-certificado-aquaviario',
        title: '2ª via de certificado',
        description: 'Fluxo homologado',
        creditCost: 1, questions: [], reviewFields: [], documentRequirements: [],
        formVersionIds: [
          'requerimento-certificacao-aquaviario-2026-v1',
          'declaracao-residencia-aquaviario-2026-v1',
        ],
      },
      {
        id: 'revalidacao-certificado-aquaviario',
        title: 'Revalidação de certificado',
        description: 'Fluxo homologado',
        creditCost: 1, questions: [], reviewFields: [], documentRequirements: [],
        formVersionIds: [
          'requerimento-certificacao-aquaviario-2026-v1',
          'declaracao-residencia-aquaviario-2026-v1',
        ],
      },
    ]);
    expect(screen.getByRole('heading', { level: 1, name: 'Aquaviários' })).toBeTruthy();
    const expectedAquaviarioLinks = [
      ['Inscrição inicial / emissão da CIR', '/preencher-real/inscricao-inicial-cir-aquaviario'],
      ['2ª via da CIR', '/preencher-real/segunda-via-cir-aquaviario'],
      ['Revalidação da CIR', '/preencher-real/revalidacao-cir-aquaviario'],
      ['Ascensão de categoria', '/preencher-real/ascensao-categoria-aquaviario'],
      ['Emissão de certificado', '/preencher-real/emissao-certificado-aquaviario'],
      ['2ª via de certificado', '/preencher-real/segunda-via-certificado-aquaviario'],
      ['Revalidação de certificado', '/preencher-real/revalidacao-certificado-aquaviario'],
    ] as const;
    for (const [name, href] of expectedAquaviarioLinks) {
      expect((await screen.findByRole('link', { name: new RegExp(name) }))
        .getAttribute('href')).toBe(href);
    }
    expect(screen.queryByText('Transferência de jurisdição')).toBeNull();
    expect(screen.queryByText('Transferência de categoria ou grupo')).toBeNull();
    expect(screen.queryByText('Homologação do LRM')).toBeNull();
    expect(screen.queryByText('Formulário em validação')).toBeNull();
  });

  it('não confunde falha da API com formulário em validação', async () => {
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
      const auth = String(input) === '/api/auth/me';
      return new Response(JSON.stringify({ error: auth ? 'unauthorized' : 'unavailable' }), {
        status: auth ? 401 : 503,
        headers: { 'Content-Type': 'application/json' },
      });
    }));
    render(
      <AuthProvider>
        <MemoryRouter initialEntries={['/servicos/amadores']}>
          <Routes>
            <Route path="/servicos/:categoryId" element={<ServiceCategoryPage />} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>,
    );

    expect(await screen.findAllByText('Disponibilidade indisponível')).toHaveLength(5);
    expect(screen.queryByText('Formulário em validação')).toBeNull();
  });

  it('permite voltar para as categorias', () => {
    renderCategory('/servicos/embarcacoes');
    expect(screen.getByRole('link', { name: /Voltar às categorias/ }).getAttribute('href')).toBe('/');
  });
});
