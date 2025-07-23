import { type t, Is } from './common.ts';

type CropInput = t.VideoCropRange | t.VideoCropRangeTuple;

/**
 * Helpers for working with the `crop` property:
 */
export const Crop = {
  /** Wrangle loose input into a plain arguments object. */
  wrangle(input?: CropInput): t.VideoCropRange | undefined {
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

  /**
   * Create a CropLens from a crop range and the full duration.
   */
  lens(input: CropInput | undefined, fullDuration: t.Secs): t.CropLens {
    const crop = Crop.wrangle(input);
    const start = Number.isFinite(crop?.start ?? NaN) ? crop!.start! : 0;
    const end = Crop.resolveEnd(crop?.end, fullDuration);
    const cropped = Math.max(0, end - start);

    return {
      duration: { full: fullDuration, cropped },

      toCropped(fullTime) {
        const rel = fullTime - start;
        return Math.max(0, Math.min(rel, cropped));
      },

      toFull(croppedTime) {
        const clamped = Math.max(0, Math.min(croppedTime, cropped));
        return start + clamped;
      },

      clamp(fullTime) {
        return Math.max(start, Math.min(fullTime, end));
      },
    };
  },
} as const;
