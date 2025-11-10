import { type t } from './common.ts';
import { normalizeCrop } from './u.ts';

/**
 * Sanitize authoring input (trim, drop empty, normalize crop).
 */
export function normalize(spec: t.VideoCompositionSpec): t.VideoCompositionSpec {
  const out: t.VideoPiece[] = [];
  for (const p of spec) {
    const src = String(p.src ?? '').trim();
    if (!src) continue;
    const slice = p.slice ? (p.slice.trim() as t.TimecodeSliceString) : undefined;
    const crop = normalizeCrop(p.crop);
    out.push({ src, slice, crop });
  }
  return out as t.VideoCompositionSpec;
}
