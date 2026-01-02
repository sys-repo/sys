import type { t } from './common.ts';
import { controller } from './u.playback.controller.ts';
import { driver } from './u.playback.driver.ts';

export const Playback: t.TimecodeDriverPlaybackLib = {
  controller,
  driver,
};
