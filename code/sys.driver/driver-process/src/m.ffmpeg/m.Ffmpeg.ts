import type { t } from './common.ts';
import { duration } from './u.duration.ts';
import { probe } from './u.probe.ts';

/** Thin system driver for FFmpeg tooling. */
export const Ffmpeg: t.FfmpegLib = {
  probe,
  duration,
};
