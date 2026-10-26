import { promisify } from 'node:util';
import { execFile as execFileCallback } from 'node:child_process';

const execFile = promisify(execFileCallback);
export type DocumentKind = 'pdf' | 'jpeg' | 'png';

function jpegSize(bytes: Buffer): { width: number; height: number } | null {
  let index = 2;
  while (index < bytes.length - 10) {
    if (bytes[index] !== 0xff) return null;
    while (bytes[index] === 0xff) index++;
    const marker = bytes[index++];
    if (marker === undefined || marker === 0xd9 || marker === 0xda) return null;
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
    if (index + 2 > bytes.length) return null;
    const length = bytes.readUInt16BE(index);
    if (length < 2 || index + length > bytes.length) return null;
    if ([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf].includes(marker)) {
      if (length < 7) return null;
      return { height: bytes.readUInt16BE(index + 3), width: bytes.readUInt16BE(index + 5) };
    }
    index += length;
  }
  return null;
}

export function classifyDocument(bytes: Buffer, contentType: string): DocumentKind {
  const kind = contentType.toLowerCase().split(';')[0]?.trim();
  if (!bytes.length || bytes.length > 10 * 1024 * 1024) throw new Error('Arquivo vazio ou acima de 10 MB.');
  if (kind === 'application/pdf' &&
    bytes.subarray(0, 5).toString('latin1') === '%PDF-' &&
    bytes.subarray(Math.max(0, bytes.length - 1024)).toString('latin1').includes('%%EOF')) {
    return 'pdf';
  }
  const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  if (kind === 'image/png' && bytes.length >= 24 &&
    bytes.subarray(0, 8).equals(pngSignature) &&
    bytes.subarray(12, 16).toString('ascii') === 'IHDR') {
    const width = bytes.readUInt32BE(16);
    const height = bytes.readUInt32BE(20);
    if (!width || !height || width * height > 16_000_000) throw new Error('Imagem muito grande.');
    return 'png';
  }
  if (kind === 'image/jpeg' && bytes.length >= 4 &&
    bytes[0] === 0xff && bytes[1] === 0xd8 &&
    bytes[bytes.length - 2] === 0xff && bytes[bytes.length - 1] === 0xd9) {
    const size = jpegSize(bytes);
    if (!size || size.width * size.height > 16_000_000) throw new Error('Imagem inválida ou muito grande.');
    return 'jpeg';
  }
  throw new Error('Assinatura e tipo de arquivo incompatíveis.');
}

export async function validatePdfPages(path: string): Promise<number> {
  const { stdout } = await execFile('pdfinfo', [path], {
    timeout: 8000, maxBuffer: 20_000, env: { ...process.env, LC_ALL: 'C' },
  });
  if (/Encrypted:\s+yes/i.test(stdout)) throw new Error('PDF criptografado não suportado.');
  const match = /^Pages:\s*(\d+)/m.exec(stdout);
  const pages = Number(match?.[1] ?? 0);
  if (!Number.isInteger(pages) || pages < 1 || pages > 5) {
    throw new Error('PDF deve ter entre 1 e 5 páginas.');
  }
  return pages;
}
