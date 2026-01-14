import type { t } from './common.ts';

import { createController as controller } from './u.controller.ts';
import { createDriver as create } from './u.driver.ts';
import { resolveBeatMedia } from './u.resolveBeatMedia.ts';
import { usePlaybackDriver as useDriver } from './use.PlaybackDriver.ts';
import { usePlaybackTimeline } from './use.PlaybackTimeline.ts';

export const PlaybackDriver: t.TimecodePlaybackDriverLib = {
  create,
  useDriver,
  Util: {
    controller,
    resolveBeatMedia,
    usePlaybackTimeline,
  },
};
