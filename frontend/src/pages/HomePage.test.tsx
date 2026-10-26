import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HomePage } from './HomePage';

function renderHome() {
  return render(
    <MemoryRouter>
      <HomePage />
    </MemoryRouter>,
  );
}

describe('HomePage', () => {
  it('apresenta a proposta e o caminho para começar', () => {
    renderHome();

    expect(
      screen.getByRole('heading', { level: 1, name: 'Documentos da Marinha sem complicação.' }),
    ).toBeTruthy();
    expect(
      screen.getByText(
        'Escolha o serviço, envie as fotos dos documentos e receba os formulários preenchidos.',
      ),
    ).toBeTruthy();

    const startLink = screen.getByRole('link', { name: /Começar agora/ });
    expect(startLink.getAttribute('href')).toBe('/preencher/servico');
  });

  it('mostra as três categorias e sinaliza as que ainda não estão disponíveis', () => {
    renderHome();

    expect(screen.getByRole('heading', { level: 2, name: 'O que você deseja fazer?' })).toBeTruthy();
    expect(screen.getByText('Embarcações e jet skis')).toBeTruthy();
    expect(screen.getByText('Arrais, Mestre e Capitão')).toBeTruthy();
    expect(screen.getByText('Aquaviários')).toBeTruthy();

    const availableCategory = screen.getByRole('link', { name: /Embarcações e jet skis/ });
    expect(availableCategory.getAttribute('href')).toBe('/preencher/servico');
    expect(screen.getAllByText('Em breve')).toHaveLength(2);
  });

  it('explica a operação real da demonstração sem prometer exclusão não implementada', () => {
    renderHome();

    expect(
      screen.getByRole('heading', { level: 2, name: 'Seus documentos ficam sob seu controle' }),
    ).toBeTruthy();
    expect(
      screen.getByText(/permanecem no seu navegador e não são enviados para nenhum servidor/),
    ).toBeTruthy();
    expect(screen.getByText(/política de exclusão serão exibidos antes de qualquer envio/)).toBeTruthy();
  });

  it('oferece atalho de acessibilidade para o conteúdo principal', () => {
    renderHome();

    const skipLink = screen.getByRole('link', { name: 'Pular para o conteúdo' });
    expect(skipLink.getAttribute('href')).toBe('#conteudo');
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  });
});
