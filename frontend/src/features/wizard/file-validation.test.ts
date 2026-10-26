import { describe, expect, it } from 'vitest';
import { MAX_DOCUMENT_BYTES, validateDocumentFile } from './file-validation';

function makeFile(name: string, type: string, content = 'conteudo'): File {
  return new File([content], name, { type });
}

describe('validateDocumentFile', () => {
  it('aceita JPG, PNG e PDF', () => {
    expect(validateDocumentFile(makeFile('foto.jpg', 'image/jpeg'))).toBeNull();
    expect(validateDocumentFile(makeFile('foto.jpeg', 'image/jpeg'))).toBeNull();
    expect(validateDocumentFile(makeFile('foto.png', 'image/png'))).toBeNull();
    expect(validateDocumentFile(makeFile('documento.pdf', 'application/pdf'))).toBeNull();
  });

  it('rejeita formatos não suportados', () => {
    expect(validateDocumentFile(makeFile('documento.txt', 'text/plain'))).toContain(
      'JPG, PNG ou PDF',
    );
    expect(validateDocumentFile(makeFile('foto.heic', 'image/heic'))).toContain(
      'JPG, PNG ou PDF',
    );
  });

  it('rejeita extensão permitida com MIME incompatível', () => {
    expect(validateDocumentFile(makeFile('documento.pdf', 'text/html'))).toContain(
      'JPG, PNG ou PDF',
    );
  });

  it('aceita extensão permitida quando o navegador não informa MIME', () => {
    expect(validateDocumentFile(makeFile('documento.png', ''))).toBeNull();
  });

  it('rejeita arquivo vazio', () => {
    expect(validateDocumentFile(makeFile('documento.pdf', 'application/pdf', ''))).toContain(
      'vazio',
    );
  });

  it('rejeita arquivo acima do limite provisório', () => {
    const file = makeFile('documento.pdf', 'application/pdf');
    Object.defineProperty(file, 'size', { configurable: true, value: MAX_DOCUMENT_BYTES + 1 });

    expect(validateDocumentFile(file)).toContain('10 MB');
  });
});
