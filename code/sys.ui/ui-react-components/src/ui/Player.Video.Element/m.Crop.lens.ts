import type { t } from './common.ts';
import { resolveEnd, toRange } from './m.Crop.u.ts';

/**
 * Create a lens for calculating a crop window within a video.
 */
export function lens(
  input: t.VideoCropRange | t.VideoCropRangeTuple | undefined,
  fullDuration: t.Secs,
): t.VideoCropLens {
  const range = input ? toRange(input) : { start: 0, end: fullDuration };
  if (!range) throw new Error('Failed to derive range definition.');

  const start = Number.isFinite(range?.start ?? NaN) ? range!.start! : 0;
  const end = resolveEnd(range?.end, fullDuration);
  const cropped = Math.max(0, end - start);

  const api: t.VideoCropLens = {
    duration: { full: fullDuration, cropped },
    range,

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

  return api;
}
