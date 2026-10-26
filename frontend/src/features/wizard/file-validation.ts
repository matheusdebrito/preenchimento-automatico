const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];
const ACCEPTED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.pdf'];

/**
 * Provisional client-side limit for early feedback only. The backend remains
 * the authority for real MIME/signature, size, page count and rate validation.
 */
export const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;

export function validateDocumentFile(file: File): string | null {
  const normalizedName = file.name.toLowerCase();
  const extension = normalizedName.slice(normalizedName.lastIndexOf('.'));
  const type = file.type.toLowerCase();
  const extensionAllowed = ACCEPTED_EXTENSIONS.includes(extension);
  const typeAllowed = type === '' || ACCEPTED_TYPES.includes(type);

  if (!extensionAllowed || !typeAllowed) {
    return 'Envie um arquivo JPG, PNG ou PDF.';
  }

  if (file.size === 0) {
    return 'O arquivo está vazio. Escolha outro arquivo.';
  }

  if (file.size > MAX_DOCUMENT_BYTES) {
    return 'O arquivo deve ter no máximo 10 MB.';
  }

  return null;
}
