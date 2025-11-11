import { type t, Delete } from './common.ts';

/**
 * Sanitize authoring input (trim src/slice, drop empty src, keep only finite non-negative duration).
 */
export function normalize(spec: t.TimecodeCompositionSpec): t.TimecodeCompositionSpec {
  const out: t.TimecodeCompositePiece[] = [];
  for (const p of spec) {
    const src = String(p?.src ?? '').trim();
    if (!src) continue;

    const sliceStr = p?.slice != null ? String(p.slice).trim() : '';
    const slice = sliceStr ? sliceStr : undefined;

    let duration: t.Msecs | undefined = undefined;
    if (typeof p?.duration === 'number' && Number.isFinite(p.duration) && p.duration >= 0) {
      duration = p.duration as t.Msecs;
    }

    out.push(Delete.undefined({ src, slice, duration }));
  }
  return out;
}
