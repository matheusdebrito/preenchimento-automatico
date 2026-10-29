import type { FormMapping } from './contracts.js';

/**
 * Identified from the attached NORMAM-211/DPC. Coordinates are intentionally
 * empty until the extracted official PDFs are versioned and visually mapped.
 */
export const amateurMappings: readonly FormMapping[] = [
  {
    id: 'requerimento-cha-amador-map-v1',
    formVersionId: 'requerimento-cha-amador-2026-v1',
    revision: 'v1',
    status: 'DRAFT',
    placements: [],
    reviewedAt: null,
    reviewer: null,
    reportPath: null,
  },
  {
    id: 'declaracao-extravio-cha-amador-map-v1',
    formVersionId: 'declaracao-extravio-cha-amador-2026-v1',
    revision: 'v1',
    status: 'DRAFT',
    placements: [],
    reviewedAt: null,
    reviewer: null,
    reportPath: null,
  },
];
