import { type t, Is } from './common.ts';

type P = t.VideoElementProps;

/**
 * If you give a negative `rawEnd`, treat it as “duration + rawEnd.”
 * Otherwise just return it (or `undefined` if you passed none).
 */
export function resolveCropEnd(rawEnd: number | undefined, duration: number) {
  if (rawEnd == null) return duration;

  // NB: positive = absolute, negative = from-the-end.
  const abs = rawEnd >= 0 ? rawEnd : duration + rawEnd;
  return Math.max(0, abs);
}

/**
 * Helpers:
 */
export const Wrangle = {
  crop(input: P['crop']): t.VideoCropRange | undefined {
    if (Array.isArray(input)) return { start: input[0], end: input[1] };
    if (Is.record(input)) return input;
    return;
  },
} as const;
