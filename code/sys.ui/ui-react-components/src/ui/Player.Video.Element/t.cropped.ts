import type { t } from './common.ts';

/**
 * A bidirectional Lens between full-length duration and
 * a cropped-time subset duration of the video
 */
export type CropLens = Readonly<{
  duration: Readonly<{ full: t.Secs; cropped: t.Secs }>;
  /** Project a full-timeline value into [0..cropped]. */
  toCropped(fullTime: t.Secs): t.Secs;
  /** Expand a cropped-timeline value back into full time. */
  toFull(croppedTime: t.Secs): t.Secs;
  /** Clamp any full-time into [start..end]. */
  clamp(fullTime: t.Secs): t.Secs;
}>;
