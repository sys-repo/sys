import { type t } from './common.ts';

export const Time: t.TimecodeCompositeLib['Time'] = {
  toVirtual,
  clamp,
};

/**
 * Convert a source timestamp inside a segment to virtual time.
 */
export function toVirtual(
  segments: readonly t.TimecodeResolvedSegment[],
  index: number,
  srcTime: t.Msecs,
): t.TimecodeVTime {
  const seg = segments[index];
  if (!seg) return 0 as t.TimecodeVTime;

  // Clamp source time into [from, to) to avoid landing on the exclusive end.
  const upper = seg.to > seg.from ? ((seg.to - 1) as t.Msecs) : seg.to;
  const clamped = srcTime < seg.from ? seg.from : srcTime > upper ? upper : srcTime;

  const offset = (clamped - seg.from) as t.Msecs;
  return (seg.vFrom + offset) as t.TimecodeVTime;
}

/** Clamp a virtual time into [0,total]. */
export function clamp(v: t.TimecodeVTime, total: t.Msecs): t.TimecodeVTime {
  if (total <= 0) return 0 as t.TimecodeVTime;
  if (v < 0) return 0 as t.TimecodeVTime;
  if (v >= total) return (total - 1) as t.TimecodeVTime; // keep inside exclusive end
  return v;
}
