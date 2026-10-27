import { mkdtemp, rm, stat } from 'node:fs/promises';
import { join } from 'node:path';

export type OcrCommand = (command: string, args: readonly string[], timeout?: number) => Promise<string>;
type Fields = Readonly<Record<string, { value: string }>>;
export type IdentityParser = (text: string, source: string) => Fields;
export type WordBox = {
  page: number; left: number; top: number; width: number; height: number;
  confidence: number; text: string;
};
export type IdentityReading = {
  width: number; height: number; lines: WordBox[][]; text: string;
};
type Anchor = WordBox;
type NameCandidate = { value: string; confidence: number; minimum: number };

const normalize = (value: string) => value.normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '').toUpperCase().replace(/\s+/g, ' ').trim();
const spelling = (value: string) => value.normalize('NFC').toUpperCase().replace(/\s+/g, ' ').trim();
const right = (word: WordBox) => word.left + word.width;
const bottom = (word: WordBox) => word.top + word.height;
const center = (word: WordBox) => word.top + word.height / 2;

/** Keep low-confidence words: dropping them could silently remove a surname. */
export function parseIdentityTsv(tsv: string): IdentityReading {
  const empty = { width: 0, height: 0, lines: [], text: '' };
  if (tsv.length > 256 * 1024) return empty;
  const rows = tsv.trimEnd().split(/\r?\n/);
  if (rows.length > 3000 || rows[0]?.split('\t')[0] !== 'level') return empty;
  const grouped = new Map<string, WordBox[]>();
  let pageWidth = 0;
  let pageHeight = 0;
  for (const row of rows.slice(1)) {
    const columns = row.split('\t');
    if (columns.length < 12) continue;
    const values = columns.slice(0, 11).map(Number);
    if (!values.every(Number.isFinite)) continue;
    const [level, page, block, paragraph, line, ordinal, left, top, width, height, confidence] = values;
    if (![level, page, block, paragraph, line, ordinal, left, top, width, height]
      .every((value) => Number.isSafeInteger(value) && value! >= 0)) continue;
    if (page !== 1 || width! <= 0 || height! <= 0) continue;
    if (level === 1) { pageWidth = width!; pageHeight = height!; continue; }
    if (level !== 5 || confidence! < 0 || confidence! > 100 || !pageWidth || !pageHeight ||
      left! + width! > pageWidth || top! + height! > pageHeight) continue;
    const text = columns.slice(11).join(' ').trim();
    if (!text || text.length > 100) continue;
    const key = [page, block, paragraph, line].join(':');
    const words = grouped.get(key) ?? [];
    words.push({ page: page!, left: left!, top: top!, width: width!, height: height!,
      confidence: confidence!, text });
    grouped.set(key, words);
  }
  const lines = [...grouped.values()].map((words) => words.sort((a, b) => a.left - b.left));
  return { width: pageWidth, height: pageHeight, lines,
    text: lines.map((words) => words.map((word) => word.text).join(' ')).join('\n') };
}

function anchors(readings: readonly IdentityReading[]): Anchor[] {
  const found: Anchor[] = [];
  const excluded: Anchor[] = [];
  for (const reading of readings) for (const words of reading.lines) {
    for (let i = 0; i < words.length; i++) {
      const word = words[i]!;
      if (!/^N[O0]M[E3](?:\/NAME)?[:.-]?$/i.test(word.text) || word.confidence < 20) continue;
      const joined = words.slice(i + 1).map((item) => normalize(item.text)).join(' ');
      if (/^(?:DA|DAS|DOS|SOCIAL|DO (?!TITULAR\b))\b/.test(joined)) {
        excluded.push(word); continue;
      }
      let consumed = 0;
      if (/^(?:COMPLETO|CIVIL)\b/.test(joined)) consumed = 1;
      else if (/^(?:DO TITULAR|E SOBRENOME|\/ NAME)\b/.test(joined)) consumed = 2;
      const last = words[i + consumed] ?? word;
      found.push({ ...word, width: right(last) - word.left,
        height: Math.max(bottom(last), bottom(word)) - word.top });
    }
  }
  const samePosition = (a: Anchor, b: Anchor) => a.page === b.page &&
    Math.abs(a.left - b.left) < Math.max(a.height, b.height) &&
    Math.abs(a.top - b.top) < Math.max(a.height, b.height) * 0.6;
  // A second reading that sees NOME DA MAE vetoes the incomplete NOME heading.
  return found.filter((item, index) => !excluded.some((other) => samePosition(item, other)) &&
    !found.slice(0, index).some((other) => samePosition(item, other)));
}

function isHeading(value: string): boolean {
  return /^(?:N[O0]M[E3]|FILIACAO|FILIAC|DATA|NASCIMENTO|NATURALIDADE|REGISTRO|GERAL|CPF|RG|DOCUMENTO|DOC\.?|ORGAO|EMISSOR|EXPEDIDOR|ASSINATURA|REPUBLICA|DA MAE|DO PAI|SOCIAL|GENITOR)\b/
    .test(normalize(value));
}

/** Take a contiguous spatial line, never concatenate different fields/columns. */
function contiguous(words: readonly WordBox[]): WordBox[] {
  const result: WordBox[] = [];
  for (const word of words) {
    const previous = result.at(-1);
    if (previous && word.left - right(previous) > 2.5 * Math.max(previous.height, word.height)) break;
    result.push(word);
  }
  return result;
}

function candidate(words: readonly WordBox[], parser: IdentityParser, source: string): NameCandidate | null {
  if (!words.length) return null;
  const value = words.map((word) => word.text).join(' ').trim();
  if (isHeading(value) || /\b(?:CPF|RG|FILIACAO|NOME|DATA (?:DE )?(?:NASCIMENTO|EXPEDICAO|EMISSAO))\b/.test(normalize(value))) return null;
  const key = source === 'seller-identity' ? 'seller.fullName' : 'person.fullName';
  if (!parser('NOME: ' + value, source)[key]) return null;
  const weight = words.reduce((sum, word) => sum + word.text.length, 0);
  return { value, minimum: Math.min(...words.map((word) => word.confidence)),
    confidence: words.reduce((sum, word) => sum + word.confidence * word.text.length, 0) / weight };
}

function nearbyWords(reading: IdentityReading, anchor: Anchor, barriers: readonly WordBox[]): WordBox[][] {
  const h = anchor.height;
  const inline = reading.lines.map((line) => line.filter((word) =>
    word.page === anchor.page && word.left >= right(anchor) &&
    Math.abs(center(word) - center(anchor)) <= Math.max(h, word.height) * 0.55))
    .filter((words) => words.length > 0 && words[0]!.left - right(anchor) <= h * 4);
  if (inline.length) return inline.map(contiguous);
  const below = reading.lines.map((line) => line.filter((word) =>
    word.page === anchor.page && word.left >= anchor.left - h * 0.6 &&
    word.top >= anchor.top + h * 0.7))
    .filter((words) => words.length > 0 &&
      Math.abs(words[0]!.left - anchor.left) <= Math.max(h * 2, reading.width * 0.08) &&
      Math.min(...words.map((word) => word.top)) - bottom(anchor) <= h * 4)
    .sort((a, b) => Math.min(...a.map((word) => word.top)) - Math.min(...b.map((word) => word.top)));
  const first = below[0];
  if (!first) return [];
  const top = Math.min(...first.map((word) => word.top));
  if (barriers.some((barrier) => barrier.page === anchor.page &&
    barrier.top > anchor.top + h * 0.7 && barrier.top < top - h * 0.3 &&
    Math.abs(barrier.left - anchor.left) <= Math.max(h * 2, reading.width * 0.08))) return [];
  return [contiguous(first)];
}

export function selectSpatialIdentityName(
  readings: readonly IdentityReading[], parser: IdentityParser, source: string,
): string | null {
  if (!['buyer-identity', 'seller-identity'].includes(source) || !readings.length) return null;
  if (readings.some((reading) => reading.width !== readings[0]!.width ||
    reading.height !== readings[0]!.height)) return null;
  const found: NameCandidate[] = [];
  const barriers = readings.flatMap((reading) => reading.lines)
    .filter((words) => isHeading(words.map((word) => word.text).join(' ')))
    .map((words) => words[0]!);
  for (const anchor of anchors(readings)) {
    for (const reading of readings) for (const words of nearbyWords(reading, anchor, barriers)) {
      const match = candidate(words, parser, source);
      if (match) found.push(match);
    }
  }
  // These scores are heuristics, NOT calibrated probabilities of correctness.
  const accepted = found.filter((item) => item.minimum >= 55 && item.confidence >= 75);
  const unique = new Set(accepted.map((item) => spelling(item.value)));
  if (unique.size !== 1) return null;
  return accepted.sort((a, b) => b.confidence - a.confidence)[0]!.value;
}

export function resolveIdentityReadings(
  readings: readonly IdentityReading[], parser: IdentityParser, source: string,
): string {
  const nameKey = source === 'seller-identity' ? 'seller.fullName' : 'person.fullName';
  const count = (reading: IdentityReading) => Object.keys(parser(reading.text, source))
    .filter((key) => key !== nameKey).length;
  const best = [...readings].sort((a, b) => count(b) - count(a))[0];
  if (!best) return '';
  const name = selectSpatialIdentityName(readings, parser, source);
  // Keep one reading for other fields; reject unverified plain-text names.
  const text = best.text.split(/\r?\n/).filter((line) => !/^\s*N[O0]M[E3]/i.test(line)).join('\n');
  return text + (name ? '\nNOME: ' + name : anchors(readings).length ? '\nNOME: ---' : '');
}

export function orientationFromOsd(text: string): number | null {
  const match = /^Rotate:\s*(0|90|180|270)\s*$/m.exec(text);
  return match ? Number(match[1]) : null;
}

function orientationScore(reading: IdentityReading, parser: IdentityParser, source: string): number {
  const labels = reading.lines.flat().filter((word) => word.confidence >= 20 &&
    /^(?:N[O0]M[E3]|CPF|REGISTRO|GERAL|FILIACAO|NATURALIDADE|NASCIMENTO)$/.test(normalize(word.text)));
  return anchors([reading]).length * 8 + new Set(labels.map((word) => normalize(word.text))).size * 2 +
    Object.keys(parser(reading.text, source)).filter((key) => key.endsWith('.cpf')).length * 3;
}

/** Local raster preprocessing; no remote OCR service or permanent text log. */
export async function readIdentityImage(
  path: string, kind: 'png' | 'jpeg', source: string, tempDir: string,
  parser: IdentityParser, run: OcrCommand,
): Promise<string> {
  const scratch = await mkdtemp(join(tempDir, 'identity-'));
  const started = Date.now();
  const command: OcrCommand = (bin, args, timeout = 15_000) => {
    const remaining = 55_000 - (Date.now() - started);
    if (remaining < 100) throw new Error('Tempo limite da leitura de identidade excedido.');
    return run(bin, args, Math.min(timeout, remaining));
  };
  const limits = ['-limit', 'thread', '1', '-limit', 'memory', '192MiB',
    '-limit', 'map', '0', '-limit', 'disk', '0'];
  const base = join(scratch, 'normalized.png');
  const oriented = join(scratch, 'oriented.png');
  const checkSize = async (file: string) => {
    if ((await stat(file)).size > 16 * 1024 * 1024) throw new Error('Raster de identidade excede o limite.');
  };
  const rotate = async (angle: number): Promise<string> => {
    if (angle === 0) return base;
    await command('convert', [...limits, 'png:' + base, '-rotate', String(angle),
      '+repage', '-strip', '-depth', '8', 'png:' + oriented], 10_000);
    await checkSize(oriented);
    return oriented;
  };
  const read = async (image: string, mode: string) => parseIdentityTsv(await command('tesseract',
    [image, 'stdout', '-l', 'por', '--psm', mode, 'tsv'], 15_000));
  try {
    // Force one raster decoder/frame, never infer a delegate from input content.
    await command('convert', [...limits, kind + ':' + path + '[0]', '-auto-orient',
      '-resize', '2400x2400>', '-background', 'white', '-alpha', 'remove', '-alpha', 'off',
      '-strip', '-depth', '8', 'png:' + base], 10_000);
    await checkSize(base);
    let angle: number | null = null;
    try {
      angle = orientationFromOsd(await command('tesseract',
        [base, 'stdout', '-l', 'osd', '--psm', '0'], 8000));
    } catch {
      // OSD can fail on short text; bounded right-angle trials follow.
    }
    let selectedAngle = angle ?? 0;
    let primary = await read(await rotate(selectedAngle), '11');
    let score = orientationScore(primary, parser, source);
    if (!anchors([primary]).length) {
      for (const other of [0, 90, 180, 270].filter((value) => value !== selectedAngle)) {
        if (Date.now() - started > 35_000) break;
        const trial = await read(await rotate(other), '11');
        const trialScore = orientationScore(trial, parser, source);
        if (trialScore > score) { primary = trial; score = trialScore; selectedAngle = other; }
        if (anchors([primary]).length) break;
      }
    }
    const alternative = await read(await rotate(selectedAngle), '6');
    return resolveIdentityReadings([primary, alternative], parser, source);
  } finally {
    await rm(scratch, { recursive: true, force: true });
  }
}
