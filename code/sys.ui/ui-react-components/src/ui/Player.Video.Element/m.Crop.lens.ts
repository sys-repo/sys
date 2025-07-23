import type { t } from './common.ts';
import { resolveEnd, wrangle } from './m.Crop.u.ts';

type CropInput = t.VideoCropRange | t.VideoCropRangeTuple;

/**
 * Create a lens for calculating a crop window within a video.
 */
export function lens(input: CropInput | undefined, fullDuration: t.Secs): t.VideoCropLens {
  const crop = wrangle(input);
  const start = Number.isFinite(crop?.start ?? NaN) ? crop!.start! : 0;
  const end = resolveEnd(crop?.end, fullDuration);
  const cropped = Math.max(0, end - start);

  const api: t.VideoCropLens = {
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

  return api;
}
