import type { t } from './common.ts';
import { createController as controller } from './u.playback.controller.ts';
import { createDriver as driver } from './u.playback.driver.ts';

export const PlaybackDriver: t.TimecodePlaybackDriverLib = {
  controller,
  driver,
};
