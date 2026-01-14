import { type t } from './common.ts';

/**
 * Thin system driver for FFmpeg tooling.
 */
export type FfmpegLib = {
  /**
   * Runtime preflight (no throwing):
   * - checks `ffprobe` (required for duration)
   * - checks `ffmpeg` (optional, future transcode)
   */
  readonly probe: (opts?: t.FfmpegProbeOptions) => Promise<t.FfmpegProbeResult>;
};
