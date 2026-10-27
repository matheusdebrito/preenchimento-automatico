import { promisify } from 'node:util';
import { execFile as execFileCallback } from 'node:child_process';

const execFile = promisify(execFileCallback);
export type DocumentKind = 'pdf' | 'jpeg' | 'png';

const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const CRC_TABLE = Array.from({ length: 256 }, (_, i) => {
  let crc = i;
  for (let j = 0; j < 8; j++) {
    crc = (crc & 1) !== 0 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
  }
  return crc >>> 0;
});

function pngCrc(bytes: Buffer, start: number, end: number): number {
  let crc = 0xffffffff;
  for (let i = start; i < end; i++) {
    crc = CRC_TABLE[(crc ^ bytes[i]!) & 0xff]! ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

/** Verify the PNG chunk structure and CRC before passing bytes to image decoders. */
function validatePng(bytes: Buffer): void {
  if (bytes.length < 45 || !bytes.subarray(0, 8).equals(PNG_SIGNATURE)) {
    throw new Error('PNG inválido.');
  }
  let offset = 8;
  let chunkNumber = 0;
  let hasData = false;
  let ended = false;
  while (offset + 12 <= bytes.length && chunkNumber++ < 4096) {
    const length = bytes.readUInt32BE(offset);
    if (length > bytes.length - offset - 12) throw new Error('PNG truncado.');
    const type = bytes.toString('ascii', offset + 4, offset + 8);
    if (!/^[A-Za-z]{4}$/.test(type)) throw new Error('Chunk PNG inválido.');
    const crc = bytes.readUInt32BE(offset + length + 8);
    if (chunkNumber === 1) {
      if (type !== 'IHDR' || length !== 13) throw new Error('IHDR PNG ausente.');
      const width = bytes.readUInt32BE(offset + 8);
      const height = bytes.readUInt32BE(offset + 12);
      if (!width || !height || width * height > 16_000_000) {
        throw new Error('Imagem muito grande.');
      }
      if (bytes[offset + 18] !== 0 || bytes[offset + 19] !== 0 ||
        ![0, 1].includes(bytes[offset + 20]!)) throw new Error('Formato PNG inválido.');
    } else if (type === 'IHDR') {
      throw new Error('IHDR PNG duplicado.');
    }
    if (pngCrc(bytes, offset + 4, offset + 8 + length) !== crc) {
      throw new Error('Checksum PNG inválido.');
    }
    if (type === 'IDAT') hasData = true;
    offset += length + 12;
    if (type === 'IEND') {
      if (length !== 0 || !hasData || offset !== bytes.length) {
        throw new Error('PNG incompleto.');
      }
      ended = true;
      break;
    }
  }
  if (!ended) throw new Error('PNG sem IEND ou com chunks demais.');
}

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
  if (kind === 'image/png') {
    validatePng(bytes);
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
  if (/^JavaScript:\s+yes/im.test(stdout)) {
    throw new Error('PDF com JavaScript embutido não suportado.');
  }
  const pageSize = /^Page size:\s*([\d.]+) x ([\d.]+) pts/im.exec(stdout);
  const width = Number(pageSize?.[1]);
  const height = Number(pageSize?.[2]);
  if (!Number.isFinite(width) || !Number.isFinite(height) ||
    width < 144 || height < 144 || width > 2000 || height > 2000) {
    throw new Error('Dimensões do PDF não suportadas.');
  }
  return pages;
}
