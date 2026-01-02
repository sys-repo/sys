import type { t } from './common.ts';
import { createController as controller } from './u.playback.controller.ts';
import { createDriver as create } from './u.playback.driver.ts';

export const PlaybackDriver: t.TimecodePlaybackDriverLib = {
  create,
  controller,
};
