import type { t } from './common.ts';
import { createPlaybackDriver as create } from './u.driver.ts';

/**
 * Clock driver for the Timecode playback system.
 */
export const PlaybackDriver: t.TimecodePlaybackDriverLib = {
  create,
};
