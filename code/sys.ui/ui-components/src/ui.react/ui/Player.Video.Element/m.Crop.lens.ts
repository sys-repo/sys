import { type t, Timecode } from './common.ts';

/**
 * Create a lens for calculating a crop window within a video.
 * Now driven by Timecode.Slice semantics ("<from>..<to>").
 */
export function lens(
  input: t.Timecode.Slice.StringInput | undefined,
  fullDuration: t.Secs,
): t.VideoCropLens {
  const totalMs = Math.max(0, Math.floor(fullDuration * 1000));

  // Use core resolver; default to full window on invalid/undefined input.
  const span = Timecode.Slice.toRange(input, fullDuration);
  const fromMs = (span?.from ?? 0) as t.Msecs;
  const toMs = (span?.to ?? totalMs) as t.Msecs;

  // Clamp and coerce invariants.
  const from = Math.max(0, Math.min(fromMs, toMs));
  const to = Math.max(from, Math.min(toMs, totalMs));

  // Convert to seconds for the lens API.
  const start = (from / 1000) as t.Secs;
  const end = (to / 1000) as t.Secs;
  const cropped = Math.max(0, end - start) as t.Secs;

  const api: t.VideoCropLens = {
    duration: { full: fullDuration, cropped },
    range: { start, end },

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
