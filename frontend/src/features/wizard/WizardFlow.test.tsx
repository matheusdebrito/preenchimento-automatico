import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { App } from '../../App';

function renderWizard() {
  return render(
    <MemoryRouter initialEntries={['/preencher/servico']}>
      <App />
    </MemoryRouter>,
  );
}

describe('fluxo de demonstração do preenchimento', () => {
  it(
    'percorre as cinco etapas e mantém ações honestas sobre créditos e PDFs',
    async () => {
      const user = userEvent.setup();
      renderWizard();

      expect(
        await screen.findByRole(
          'heading',
          { level: 1, name: 'O que você precisa fazer?' },
          { timeout: 5000 },
        ),
      ).toBeTruthy();

      await user.click(screen.getByRole('button', { name: 'Continuar' }));
      expect(screen.getByRole('alert').textContent).toContain('Escolha um serviço para continuar.');

      await user.click(screen.getByRole('radio', { name: /Transferência de moto aquática/ }));
      await user.click(screen.getByRole('button', { name: 'Continuar' }));

      expect(
        await screen.findByRole(
          'heading',
          { level: 1, name: 'Envie os documentos' },
          { timeout: 5000 },
        ),
      ).toBeTruthy();
      expect(screen.getByText('Não envie documentos reais nesta demonstração')).toBeTruthy();

      await user.click(screen.getByRole('button', { name: 'Continuar com dados de exemplo' }));

      expect(
        await screen.findByRole(
          'heading',
          { level: 1, name: 'Leitura dos documentos' },
          { timeout: 5000 },
        ),
      ).toBeTruthy();
      expect(screen.getByText('Prévia de interface')).toBeTruthy();

      await user.click(screen.getByRole('button', { name: 'Ver dados de exemplo' }));

      expect(
        await screen.findByRole(
          'heading',
          { level: 1, name: 'Confira os dados encontrados' },
          { timeout: 5000 },
        ),
      ).toBeTruthy();

      expect(screen.getAllByText('Precisa conferir')).toHaveLength(3);
      expect(screen.getAllByText('Confirmado')).toHaveLength(3);
      expect(screen.getAllByText('Não encontrado')).toHaveLength(2);
      expect(
        (screen.getByLabelText('Nome completo') as HTMLInputElement).value,
      ).toBe('Maria Exemplo da Silva');

      await user.type(screen.getByLabelText('CEP'), '00000-000');
      await user.type(screen.getByLabelText('Número do motor'), 'MOTOR-EXEMPLO');

      await user.click(
        screen.getByRole('button', { name: 'Confirmar e preparar formulários' }),
      );

      expect(
        await screen.findByRole(
          'heading',
          { level: 1, name: 'Prévia dos formulários' },
          { timeout: 5000 },
        ),
      ).toBeTruthy();
      expect(screen.getByText('Prévia de entrega')).toBeTruthy();

      const downloadButton = screen.getByRole('button', { name: 'Baixar PDF' });
      expect((downloadButton as HTMLButtonElement).disabled).toBe(true);

      await user.click(screen.getByRole('button', { name: 'Encerrar demonstração' }));

      expect(
        await screen.findByRole(
          'heading',
          { level: 1, name: 'Documentos da Marinha sem complicação.' },
          { timeout: 5000 },
        ),
      ).toBeTruthy();
    },
    30000,
  );

  it(
    'impede avançar para etapas internas sem escolher um serviço',
    async () => {
      render(
        <MemoryRouter initialEntries={['/preencher/conferencia']}>
          <App />
        </MemoryRouter>,
      );

      expect(
        await screen.findByRole(
          'heading',
          { level: 1, name: 'O que você precisa fazer?' },
          { timeout: 5000 },
        ),
      ).toBeTruthy();
    },
    15000,
  );
});
