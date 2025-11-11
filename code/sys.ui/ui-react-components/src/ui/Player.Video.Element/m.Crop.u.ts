import { type t, Timecode } from './common.ts';

/**
 * Wrangle loose input into a plain arguments object.
 */
export function toRange(input?: t.TimecodeSliceStringInput): t.MsecSpan | undefined {
  return Timecode.Slice.toRange(input);
}

/**
 * Calculate the end seconds.
 * Positive value → absolute, negative value → from-the-end.
 */
export function resolveEnd(rawEnd: t.Secs | undefined, duration: t.Secs) {
  if (rawEnd == null) return duration;
  const abs = rawEnd >= 0 ? rawEnd : duration + rawEnd;
  return Math.max(0, abs);
}
