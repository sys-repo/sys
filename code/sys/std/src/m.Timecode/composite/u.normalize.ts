import { type t } from './common.ts';
import { normalizeCrop } from './u.ts';

/**
 * Sanitize authoring input (trim, drop empty, normalize crop).
 */
export function normalize(spec: t.TimecodeCompositionSpec): t.TimecodeCompositionSpec {
  const out: t.TimecodeCompositePiece[] = [];
  for (const p of spec) {
    const src = String(p.src ?? '').trim();
    if (!src) continue;
    const slice = p.slice ? String(p.slice).trim() : undefined;
    const crop = normalizeCrop(p.crop);
    out.push({ src, slice, crop });
  }
  return out as t.TimecodeCompositionSpec;
}
