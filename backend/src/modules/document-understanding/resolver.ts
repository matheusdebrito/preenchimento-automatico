import type { FieldEvidence } from './contracts.js';

export interface ResolvedEvidence {
  values: Record<string, string>;
  sourceNotes: Record<string, string>;
  conflicts: readonly string[];
}

const canonical = (value: string): string =>
  value.normalize('NFC').replace(/\s+/g, ' ').trim().toUpperCase();

export function resolveFieldEvidence(
  evidence: readonly FieldEvidence[],
  allowedFields?: ReadonlySet<string>,
): ResolvedEvidence {
  const grouped = new Map<string, FieldEvidence[]>();
  for (const item of evidence) {
    if (allowedFields && !allowedFields.has(item.fieldId)) continue;
    const group = grouped.get(item.fieldId) ?? [];
    group.push(item);
    grouped.set(item.fieldId, group);
  }

  const values: Record<string, string> = {};
  const sourceNotes: Record<string, string> = {};
  const conflicts: string[] = [];

  for (const [fieldId, items] of grouped) {
    const byValue = new Map<string, FieldEvidence[]>();
    for (const item of items) {
      const key = canonical(item.value);
      const matches = byValue.get(key) ?? [];
      matches.push(item);
      byValue.set(key, matches);
    }
    if (byValue.size !== 1) {
      conflicts.push(fieldId);
      sourceNotes[fieldId] = 'Divergência entre documentos: revisar manualmente.';
      continue;
    }

    const sameValue = [...byValue.values()][0]!;
    const best = [...sameValue].sort((a, b) => (b.confidence ?? -1) - (a.confidence ?? -1))[0]!;
    values[fieldId] = best.value;
    sourceNotes[fieldId] = [...new Set(sameValue.map((item) => item.sourceId))].join(', ');
  }

  return { values, sourceNotes, conflicts };
}
