import { type t, Timecode } from './common.ts';

/**
 * Internals:
 */
export function normalizeCrop(
  crop?: t.VideoCropRange | t.VideoCropRangeTuple,
): t.VideoCropRangeTuple | undefined {
  if (!crop) return undefined;
  return Array.isArray(crop) ? (crop as t.VideoCropRangeTuple) : [crop.start, crop.end];
}

export function tryParseSlice(
  input?: t.TimecodeSliceString,
): { ok: true; parsed?: t.TimecodeSlice } | { ok: false } {
  if (!input) return { ok: true };
  if (!Timecode.Slice.is(input)) return { ok: false };
  return { ok: true, parsed: Timecode.Slice.parse(input) };
}

export function resolvePiece(
  piece: t.VideoPiece,
  duration: t.Msecs,
  vFrom: t.Msecs,
): t.VideoResolvedSegment | null {
  let from = 0 as t.Msecs;
  let to = duration;

  if (piece.slice) {
    const parsed = Timecode.Slice.parse(piece.slice);
    const r = Timecode.Slice.resolve(parsed, duration);
    from = r.from;
    to = r.to;
  }
  if (to <= from) return null;

  const vTo = (vFrom + (to - from)) as t.Msecs;

  return {
    src: piece.src,
    from,
    to,
    vFrom,
    vTo,
    crop: normalizeCrop(piece.crop),
  };
}

export function findSegmentByVTime(
  segments: readonly t.VideoResolvedSegment[],
  vTime: t.VideoVTime,
): number {
  let lo = 0;
  let hi = segments.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const s = segments[mid];
    if (vTime < s.vFrom) hi = mid - 1;
    else if (vTime >= s.vTo) lo = mid + 1;
    else return mid;
  }
  return -1;
}
