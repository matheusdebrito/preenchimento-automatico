import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { DocumentUploadCard } from './DocumentUploadCard';
import { DEMO_DOCUMENT_REQUIREMENTS } from '../../data/demo';

const requirement = DEMO_DOCUMENT_REQUIREMENTS[0];

if (!requirement) {
  throw new Error('Requisito de demonstração ausente');
}

function renderCard(onAddFiles = vi.fn(), onRemoveFile = vi.fn()) {
  const view = render(
    <DocumentUploadCard
      requirement={requirement}
      uploads={[]}
      onAddFiles={onAddFiles}
      onRemoveFile={onRemoveFile}
    />,
  );

  const input = view.container.querySelector('input[type="file"]:not([capture])');

  if (!(input instanceof HTMLInputElement)) {
    throw new Error('Campo de arquivo não encontrado');
  }

  return { ...view, input, onAddFiles, onRemoveFile };
}

describe('DocumentUploadCard', () => {
  it('rejeita formato não permitido com mensagem clara', () => {
    const { input, onAddFiles } = renderCard();
    const invalidFile = new File(['conteudo'], 'documento.txt', { type: 'text/plain' });

    fireEvent.change(input, { target: { files: [invalidFile] } });

    expect(screen.getByRole('alert').textContent).toContain(
      'Envie um arquivo JPG, PNG ou PDF.',
    );
    expect(onAddFiles).not.toHaveBeenCalled();
  });

  it('aceita um PDF válido e limpa o erro anterior', () => {
    const { input, onAddFiles } = renderCard();
    const invalidFile = new File(['conteudo'], 'documento.txt', { type: 'text/plain' });
    const validFile = new File(['conteudo'], 'documento.pdf', { type: 'application/pdf' });

    fireEvent.change(input, { target: { files: [invalidFile] } });
    expect(screen.getByRole('alert')).toBeTruthy();

    fireEvent.change(input, { target: { files: [validFile] } });

    expect(screen.queryByRole('alert')).toBeNull();
    expect(onAddFiles).toHaveBeenCalledWith([validFile]);
  });
});
