import { type t } from './common.ts';

export const Time: t.TimecodeCompositeLib['Time'] = {
  toVirtual,
  clamp,
};

/**
 * Convert a source timestamp inside a segment to virtual time.
 * Clamps `srcTime` into the segment's original span [from,to) to avoid the exclusive end.
 */
export function toVirtual(
  segments: t.Ary<t.TimecodeResolvedSegment>,
  index: number,
  srcTime: t.Msecs,
): t.TimecodeVTime {
  const seg = segments[index];
  if (!seg) return 0 as t.TimecodeVTime;

  // Clamp source time into [from, to) to avoid landing on the exclusive end.
  const { original, virtual } = seg;
  const upper = original.to > original.from ? ((original.to - 1) as t.Msecs) : original.to;
  const clamped = srcTime < original.from ? original.from : srcTime > upper ? upper : srcTime;

  const offset = clamped - original.from;
  return virtual.from + offset;
}

/**
 * Clamp a virtual time into [0,total). Keeps inside the exclusive end by returning total-1 when v ≥ total.
 */
export function clamp(v: t.TimecodeVTime, total: t.Msecs): t.TimecodeVTime {
  if (total <= 0) return 0;
  if (v < 0) return 0;
  if (v >= total) return total - 1; // keep inside exclusive end
  return v;
}
