import type { t } from './common.ts';
import { createController as controller } from './u.controller.ts';
import { createDriver as create } from './u.driver.ts';
import { usePlaybackDriver as useDriver } from './use.PlaybackDriver.ts';

export const PlaybackDriver: t.TimecodePlaybackDriverLib = {
  create,
  controller,
  useDriver,
};
