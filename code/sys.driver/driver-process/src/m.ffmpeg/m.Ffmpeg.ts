import { type t } from './common.ts';
import { duration } from './u.duration.ts';
import { probe } from './u.probe.ts';

export const Ffmpeg: t.FfmpegLib = {
  probe,
  duration,
};
