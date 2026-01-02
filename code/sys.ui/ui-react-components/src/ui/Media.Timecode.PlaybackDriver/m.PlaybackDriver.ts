import type { t } from './common.ts';
import { createController as controller } from './u.controller.ts';
import { createDriver as create } from './u.driver.ts';

export const PlaybackDriver: t.TimecodePlaybackDriverLib = {
  create,
  controller,
};
