import type { t } from './common.ts';

export type FfmpegProbeOptions = {
  /** When true, require `ffmpeg` too (default false). */
  readonly requireFfmpeg?: boolean;

  /** Override executable names/paths (default: "ffprobe"/"ffmpeg"). */
  readonly bin?: {
    readonly ffprobe?: string;
    readonly ffmpeg?: string;
  };
};

/** Result from `Ffmpeg.probe` method */
export type FfmpegProbeResult =
  | { readonly ok: true; readonly bin: { readonly ffprobe: string; readonly ffmpeg?: string } }
  | {
      readonly ok: false;
      readonly reason: FfmpegProbeReason;
      readonly hint: string;
      readonly error?: unknown;
    };
export type FfmpegProbeReason =
  | 'missing-ffprobe'
  | 'missing-ffmpeg'
  | 'not-executable'
  | 'spawn-failed';
