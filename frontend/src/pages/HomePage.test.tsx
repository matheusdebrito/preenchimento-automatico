import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HomePage } from './HomePage';
import { AuthProvider } from '../features/auth/AuthProvider';

function renderHome() {
  vi.stubGlobal('fetch', vi.fn(async (url: RequestInfo | URL) => new Response(
    JSON.stringify(String(url) === '/api/auth/me' ? { error: 'unauthorized' } : {}),
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
  it('apresenta somente as três categorias principais', () => {
    renderHome();

    expect(
      screen.getByRole('heading', { level: 1, name: 'Documentos da Marinha sem complicação.' }),
    ).toBeTruthy();
    expect(
      screen.getByRole('heading', { level: 2, name: 'Qual tipo de serviço você precisa?' }),
    ).toBeTruthy();

    expect(screen.getByRole('link', { name: /Embarcações e jet skis/ })
      .getAttribute('href')).toBe('/servicos/embarcacoes');
    expect(screen.getByRole('link', { name: /Arrais, Mestre e Capitão/ })
      .getAttribute('href')).toBe('/servicos/amadores');
    expect(screen.getByRole('link', { name: /Aquaviários/ })
      .getAttribute('href')).toBe('/servicos/aquaviarios');

    expect(screen.queryByText('Inscrição inicial de embarcação')).toBeNull();
    expect(screen.queryByText('Transferência de propriedade')).toBeNull();
  });

  it('usa o CTA do hero para levar às categorias, não a um serviço específico', () => {
    renderHome();

    const startLink = screen.getByRole('link', { name: /Ver categorias/ });
    expect(startLink.getAttribute('href')).toBe('/#categories-title');
  });

  it('mantém o aviso de processamento temporário dos documentos', () => {
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

    expect(screen.getByRole('link', { name: 'Pular para o conteúdo' })
      .getAttribute('href')).toBe('#conteudo');
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  });
});
