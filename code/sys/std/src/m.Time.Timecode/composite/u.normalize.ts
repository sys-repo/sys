import { type t, Delete } from './common.ts';

/**
 * Sanitize authoring input (trim, drop empty, normalize crop).
 */
export function normalize(spec: t.TimecodeCompositionSpec): t.TimecodeCompositionSpec {
  const out: t.TimecodeCompositePiece[] = [];
  for (const p of spec) {
    const src = String(p.src ?? '').trim();
    if (!src) continue;
    const slice = (p.slice ? String(p.slice).trim() : undefined) || undefined;
    out.push(Delete.undefined({ src, slice }));
  }
  return out;
}
