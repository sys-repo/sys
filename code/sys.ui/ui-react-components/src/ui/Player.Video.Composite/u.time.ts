import { type t } from './common.ts';

export const Time: t.CompositeVideoHelpers['Time'] = {
  toVirtual,
  clamp,
};

/**
 * Convert a source timestamp inside a segment to virtual time.
 */
export function toVirtual(
  segments: readonly t.VideoResolvedSegment[],
  index: number,
  srcTime: t.Msecs,
): t.VideoVTime {
  const seg = segments[index];
  if (!seg) return 0 as t.VideoVTime;

  // Clamp source time into [from, to) to avoid landing on the exclusive end.
  const upper = seg.to > seg.from ? ((seg.to - 1) as t.Msecs) : seg.to;
  const clamped = srcTime < seg.from ? seg.from : srcTime > upper ? upper : srcTime;

  const offset = (clamped - seg.from) as t.Msecs;
  return (seg.vFrom + offset) as t.VideoVTime;
}

/** Clamp a virtual time into [0,total]. */
export function clamp(v: t.VideoVTime, total: t.Msecs): t.VideoVTime {
  if (total <= 0) return 0 as t.VideoVTime;
  if (v < 0) return 0 as t.VideoVTime;
  if (v >= total) return (total - 1) as t.VideoVTime; // keep inside exclusive end
  return v;
}
