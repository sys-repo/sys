import { type t, Is } from './common.ts';

type CropInput = t.VideoCropRange | t.VideoCropRangeTuple;

/**
 * Wrangle loose input into a plain arguments object.
 */
export function wrangle(input?: CropInput): t.VideoCropRange | undefined {
  if (Array.isArray(input)) return { start: input[0], end: input[1] };
  if (Is.record(input)) return input;
  return;
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
