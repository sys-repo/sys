import { type t } from './common.ts';
import { resolvePiece } from './u.ts';

/**
 * Build a resolved timeline from authoring spec + known durations.
 */
export function resolve(
  spec: t.VideoCompositionSpec,
  durations: t.VideoDurationMap,
): t.VideoCompositionResolved {
  const segments: t.VideoResolvedSegment[] = [];
  let vCursor = 0 as t.Msecs;

  for (const piece of spec) {
    const d = durations[piece.src];
    if (typeof d !== 'number' || d <= 0) continue;

    const seg = resolvePiece(piece, d, vCursor);
    if (!seg) continue;

    segments.push(seg);
    vCursor = seg.vTo;
  }

  return {
    segments,
    total: vCursor,
  };
}
