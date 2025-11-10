import { type t } from './common.ts';
import { findSegmentByVTime } from './u.ts';

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
  const offset = (vTime - seg.vFrom) as t.Msecs;
  const srcTime = (seg.from + offset) as t.Msecs;
  return { index, seg, srcTime, offset };
}

/**
 * Helpers:
 */
function totalOf(segments: readonly t.TimecodeResolvedSegment[]): t.Msecs {
  return segments.length ? segments[segments.length - 1].vTo : (0 as t.Msecs);
}
