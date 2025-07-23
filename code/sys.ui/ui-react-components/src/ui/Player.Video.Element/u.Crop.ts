import { type t, Is } from './common.ts';

/**
 * Helpers for working with the `crop` property:
 */
export const Crop = {
  /** Wrangle loose input into a plain arguments object. */
  wrangle(input?: t.VideoCropRange | t.VideoCropRangeTuple): t.VideoCropRange | undefined {
    if (Array.isArray(input)) return { start: input[0], end: input[1] };
    if (Is.record(input)) return input;
    return;
  },

  /**
   * Calculate the end seconds.
   * Positive value → absolute, negative value → from-the-end.
   */
  resolveEnd(rawEnd: t.Secs | undefined, duration: t.Secs) {
    if (rawEnd == null) return duration;
    const abs = rawEnd >= 0 ? rawEnd : duration + rawEnd;
    return Math.max(0, abs);
  },
} as const;
