import type { t } from './common.ts';

/**
 * Clock driver for the Timecode playback system.
 */
export type TimecodePlaybackDriverLib = {
  /** Create a new instance of the driver. */
  create(args: t.CreatePlaybackDriverArgs): t.PlaybackDriver;
};
