import { type t } from './common.ts';
import { useHead, usePlaybackRuntime } from './use.head.ts';
import { shouldInitPlayback, toCurrentPayload, toCurrentPosition, toPlaybackData } from './u.head.ts';

export const MediaPlaybackHead: t.MediaPlaybackDriver.HeadLib = {
  useHead,
  usePlaybackRuntime,
  should: {
    initPlayback: shouldInitPlayback,
  },
  toPlaybackData,
  toCurrentPosition,
  toCurrentPayload,
};
