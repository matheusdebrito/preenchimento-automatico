import type { PaddleOcrResult } from '../jobs/paddle-ocr.js';
import type { DocumentObservation } from './contracts.js';

export function paddleToObservation(result: PaddleOcrResult): DocumentObservation {
  return {
    engine: 'paddleocr',
    engineVersion: result.version,
    model: result.model,
    elapsedMs: result.elapsedMs,
    pages: result.pages.map((page) => ({
      page: page.page,
      orientation: page.orientation,
      lines: page.lines.map((line, index) => ({
        id: page.page + ':' + index,
        page: page.page,
        text: line.text,
        confidence: line.confidence,
        box: line.box,
        polygon: line.polygon,
      })),
    })),
  };
}
