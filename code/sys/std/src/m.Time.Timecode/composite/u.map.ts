import type { t } from './common.ts';

/**
 * Map a virtual time to its backing source segment/time (or null).
 */
export function mapToSource(
  segments: readonly t.TimecodeResolvedSegment[],
  vTime: t.TimecodeVTime,
): t.TimecodeMapToSourceResult | null {
  if (segments.length === 0) return null;
  const total = totalOf(segments);
  if (vTime < 0 || vTime >= total) return null;

  const index = findSegmentByVTime(segments, vTime);
  if (index < 0) return null;

  const seg = segments[index];
  const offset = (vTime - seg.virtual.from) as t.Msecs;
  const srcTime = (seg.original.from + offset) as t.Msecs;
  return { index, seg, srcTime, offset };
}

/**
 * Internal:
 */
function totalOf(segments: readonly t.TimecodeResolvedSegment[]): t.Msecs {
  return segments.length ? segments[segments.length - 1].virtual.to : (0 as t.Msecs);
}

export function findSegmentByVTime(
  segments: readonly t.TimecodeResolvedSegment[],
  vTime: t.TimecodeVTime,
): number {
  let lo = 0;
  let hi = segments.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const s = segments[mid];
    if (vTime < s.virtual.from) hi = mid - 1;
    else if (vTime >= s.virtual.to) lo = mid + 1;
    else return mid;
  }
  return -1;
}
// 🌸 ---------- /CHANGED ----------
