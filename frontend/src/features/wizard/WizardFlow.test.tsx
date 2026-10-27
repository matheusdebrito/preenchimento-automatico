import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { App } from '../../App';

afterEach(() => vi.unstubAllGlobals());

describe('retirada do fluxo de demonstração duplicado', () => {
  it.each(['/preencher/servico', '/preencher/conferencia', '/preencher/download'])(
    'redireciona %s para a página inicial sem oferecer um serviço paralelo',
    async (oldPath) => {
      vi.stubGlobal('fetch', vi.fn(async (url: RequestInfo | URL) =>
        new Response(JSON.stringify(String(url) === '/api/auth/me'
          ? { error: 'unauthorized' } : { services: [] }), {
          status: String(url) === '/api/auth/me' ? 401 : 200,
          headers: { 'Content-Type': 'application/json' },
        })));
      render(<MemoryRouter initialEntries={[oldPath]}><App /></MemoryRouter>);
      expect(await screen.findByRole('heading', {
        level: 1, name: 'Documentos da Marinha sem complicação.',
      })).toBeTruthy();
      expect(screen.queryByRole('heading', { name: 'O que você precisa fazer?' })).toBeNull();
      expect(document.querySelector('a[href="/preencher/servico"]')).toBeNull();
    },
  );
});
