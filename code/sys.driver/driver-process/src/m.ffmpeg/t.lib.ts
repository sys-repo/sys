import { type t } from './common.ts';

/**
 * Thin system driver for FFmpeg tooling.
 */
export type FfmpegLib = {
  /** Runtime preflight (no throwing): */
  readonly probe: t.FfmpegProbeFn;

  /** Return the total duration of a media file in milliseconds. */
  readonly duration: t.MediaDurationFn;
};
